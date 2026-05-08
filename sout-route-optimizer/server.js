const express = require('express');
const axios = require('axios');
const path = require('path');
const XLSX = require('xlsx');

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// Константы
const COST_PER_KM = 14; // рублей за км
const SERVICE_TIME_MIN = 30; // минут на организацию
const BARNAUL_COORDS = [53.3606, 83.7617]; // Барнаул

// Пример данных организаций (можно расширять)
const defaultOrganizations = [
    { id: 1, name: "ООО 'АлтайПром'", address: "Барнаул, проспект Ленина, 50", lat: 53.3515, lng: 83.7505, workplaces: 15 },
    { id: 2, name: "ЗАО 'Сибирь'", address: "Бийск, улица Ленина, 100", lat: 52.5347, lng: 85.3394, workplaces: 25 },
    { id: 3, name: "ООО 'Горняк'", address: "Рубцовск, улица Трактовая, 45", lat: 51.5167, lng: 81.2000, workplaces: 18 },
    { id: 4, name: "АО 'АлтайАгро'", address: "Камень-на-Оби, улица Ленина, 20", lat: 53.7833, lng: 81.3500, workplaces: 12 },
    { id: 5, name: "ООО 'ТрансСервис'", address: "Новоалтайск, улица Пушкина, 15", lat: 53.4167, lng: 83.9333, workplaces: 8 },
    { id: 6, name: "ЗАО 'Металлист'", address: "Заринск, улица Металлургов, 10", lat: 53.7167, lng: 84.9500, workplaces: 22 },
    { id: 7, name: "ООО 'ЛесПром'", address: "Белокуриха, улица Советская, 5", lat: 51.9833, lng: 84.9833, workplaces: 10 },
    { id: 8, name: "АО 'Химик'", address: "Новоалтайск, улица Гагарина, 30", lat: 53.4200, lng: 83.9400, workplaces: 14 },
    { id: 9, name: "ООО 'СтройМатериалы'", address: "Алейск, улица Октябрьская, 25", lat: 52.5000, lng: 82.8000, workplaces: 16 },
    { id: 10, name: "ЗАО 'Пищевик'", address: "Славгород, улица Ленина, 50", lat: 52.9833, lng: 78.6500, workplaces: 20 }
];

// Функция расчета расстояния между двумя точками (Haversine formula для оценки)
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Радиус Земли в км
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Оптимизация маршрута с использованием жадного алгоритма с возвратом в Барнаул
function optimizeRoute(organizations, days, maxDailyDriveTime = 8 * 60) {
    if (!organizations || organizations.length === 0) {
        return { days: [], totalDistance: 0, totalCost: 0, totalServiceTime: 0 };
    }

    const result = {
        days: [],
        totalDistance: 0,
        totalCost: 0,
        totalServiceTime: 0,
        totalOrganizations: 0,
        totalWorkplaces: 0
    };

    let remaining = [...organizations];
    
    for (let day = 1; day <= days && remaining.length > 0; day++) {
        const dayRoute = {
            day: day,
            stops: [],
            distance: 0,
            driveTime: 0,
            serviceTime: 0,
            organizations: 0,
            workplaces: 0
        };

        let currentPos = BARNAUL_COORDS;
        let dailyDriveTime = 0;
        let visitedToday = [];

        while (remaining.length > 0) {
            // Найти ближайшую непосещенную организацию
            let nearest = null;
            let nearestDist = Infinity;
            let nearestIndex = -1;

            for (let i = 0; i < remaining.length; i++) {
                const org = remaining[i];
                const dist = calculateDistance(currentPos[0], currentPos[1], org.lat, org.lng);
                // Примерное время в пути (средняя скорость 60 км/ч)
                const timeToOrg = (dist / 60) * 60; // минуты
                
                // Проверка: успеем ли вернуться в Барнаул сегодня
                const distBack = calculateDistance(org.lat, org.lng, BARNAUL_COORDS[0], BARNAUL_COORDS[1]);
                const timeBack = (distBack / 60) * 60;
                
                const totalTimeNeeded = dailyDriveTime + timeToOrg + SERVICE_TIME_MIN + timeBack;

                if (dist < nearestDist && totalTimeNeeded <= maxDailyDriveTime) {
                    nearest = org;
                    nearestDist = dist;
                    nearestIndex = i;
                }
            }

            if (nearest === null) {
                // Нет организаций, которые можно посетить сегодня
                break;
            }

            // Добавить организацию в маршрут дня
            const timeToNearest = (nearestDist / 60) * 60;
            dayRoute.distance += nearestDist;
            dayRoute.driveTime += timeToNearest;
            dayRoute.serviceTime += SERVICE_TIME_MIN;
            dayRoute.organizations++;
            dayRoute.workplaces += nearest.workplaces;
            dayRoute.stops.push({
                ...nearest,
                distanceFromPrev: nearestDist,
                timeFromPrev: timeToNearest
            });

            currentPos = [nearest.lat, nearest.lng];
            dailyDriveTime += timeToNearest + SERVICE_TIME_MIN;
            visitedToday.push(nearest.id);
            remaining.splice(nearestIndex, 1);
        }

        // Возврат в Барнаул
        if (dayRoute.stops.length > 0) {
            const lastStop = dayRoute.stops[dayRoute.stops.length - 1];
            const distBack = calculateDistance(lastStop.lat, lastStop.lng, BARNAUL_COORDS[0], BARNAUL_COORDS[1]);
            const timeBack = (distBack / 60) * 60;
            
            dayRoute.distance += distBack;
            dayRoute.driveTime += timeBack;
            dayRoute.stops.push({
                name: "Возврат в Барнаул",
                address: "Барнаул",
                lat: BARNAUL_COORDS[0],
                lng: BARNAUL_COORDS[1],
                isReturn: true,
                distanceFromPrev: distBack,
                timeFromPrev: timeBack
            });

            result.totalDistance += dayRoute.distance;
            result.totalServiceTime += dayRoute.serviceTime;
            result.totalOrganizations += dayRoute.organizations;
            result.totalWorkplaces += dayRoute.workplaces;
            result.days.push(dayRoute);
        }
    }

    result.totalCost = result.totalDistance * COST_PER_KM;
    
    return result;
}

// API endpoint для расчета маршрута
app.post('/api/calculate-route', (req, res) => {
    try {
        const { organizations, days, perDiem } = req.body;
        
        const orgs = organizations && organizations.length > 0 ? organizations : defaultOrganizations;
        const tripDays = days || 3;
        const perDiemAmount = perDiem || 1500; // командировочные в день по умолчанию

        const route = optimizeRoute(orgs, tripDays);

        const totalPerDiem = tripDays * perDiemAmount;
        const totalTripCost = route.totalCost + totalPerDiem;
        const costPerWorkplace = route.totalWorkplaces > 0 ? totalTripCost / route.totalWorkplaces : 0;

        res.json({
            success: true,
            route: route,
            financials: {
                fuelCost: route.totalCost,
                perDiem: totalPerDiem,
                totalCost: totalTripCost,
                costPerWorkplace: costPerWorkplace,
                perDiemPerDay: perDiemAmount
            },
            summary: {
                totalOrganizations: route.totalOrganizations,
                totalWorkplaces: route.totalWorkplaces,
                totalDistance: route.totalDistance.toFixed(2),
                totalDriveTime: route.days.reduce((sum, day) => sum + day.driveTime, 0),
                totalServiceTime: route.totalServiceTime,
                daysUsed: route.days.length
            }
        });
    } catch (error) {
        console.error('Error calculating route:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// API endpoint для загрузки и парсинга Excel файла
app.post('/api/upload-excel', (req, res) => {
    try {
        const { excelData } = req.body;
        
        if (!excelData) {
            return res.status(400).json({ success: false, error: 'Нет данных Excel' });
        }

        // Декодирование base64 данных
        const base64Data = excelData.split(',')[1] || excelData;
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Чтение Excel файла
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Парсинг данных с автоматическим распознаванием колонок
        const organizations = [];
        let nameCol = -1;
        let addressCol = -1;
        let workplacesCol = -1;
        let latCol = -1;
        let lngCol = -1;

        // Поиск заголовков в первой строке
        if (data.length > 0) {
            const headers = data[0].map(h => String(h).toLowerCase().trim());
            
            // Распознавание колонок
            headers.forEach((header, index) => {
                if (header.includes('организация') || header.includes('название') || header.includes('name') || header.includes('org')) {
                    nameCol = index;
                } else if (header.includes('адрес') || header.includes('address') || header.includes('location')) {
                    addressCol = index;
                } else if (header.includes('рабоч') || header.includes('workplace') || header.includes('count') || header.includes('кол')) {
                    workplacesCol = index;
                } else if (header.includes('шир') || header.includes('lat') || header.includes('latitude')) {
                    latCol = index;
                } else if (header.includes('долг') || header.includes('lng') || header.includes('lon') || header.includes('longitude')) {
                    lngCol = index;
                }
            });
        }

        // Обработка строк с данными
        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            if (!row || row.length === 0) continue;

            const name = nameCol >= 0 && row[nameCol] ? String(row[nameCol]).trim() : `Организация ${i}`;
            const address = addressCol >= 0 && row[addressCol] ? String(row[addressCol]).trim() : '';
            const workplaces = workplacesCol >= 0 && row[workplacesCol] ? parseInt(row[workplacesCol]) : 1;
            const lat = latCol >= 0 && row[latCol] ? parseFloat(row[latCol]) : null;
            const lng = lngCol >= 0 && row[lngCol] ? parseFloat(row[lngCol]) : null;

            // Пропускать пустые строки
            if (!address && !lat && !lng) continue;

            organizations.push({
                id: i,
                name: name,
                address: address,
                workplaces: isNaN(workplaces) || workplaces <= 0 ? 1 : workplaces,
                lat: lat,
                lng: lng
            });
        }

        if (organizations.length === 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'Не найдено данных об организациях. Проверьте формат файла.' 
            });
        }

        res.json({
            success: true,
            organizations: organizations,
            count: organizations.length
        });
    } catch (error) {
        console.error('Error parsing Excel:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка при обработке Excel файла: ' + error.message 
        });
    }
});

// API endpoint для геокодирования адреса (используем Nominatim OpenStreetMap)
app.post('/api/geocode', async (req, res) => {
    try {
        const { address } = req.body;
        
        if (!address) {
            return res.status(400).json({ success: false, error: 'Адрес не указан' });
        }

        // Добавляем "Алтайский край" для лучшей точности
        const fullAddress = `${address}, Алтайский край, Россия`;
        const encodedAddress = encodeURIComponent(fullAddress);
        
        const response = await axios.get(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`,
            {
                headers: {
                    'User-Agent': 'SOUT-Route-Optimizer/1.0'
                }
            }
        );

        if (response.data && response.data.length > 0) {
            const result = response.data[0];
            res.json({
                success: true,
                lat: parseFloat(result.lat),
                lng: parseFloat(result.lon),
                displayName: result.display_name
            });
        } else {
            res.json({
                success: false,
                error: 'Адрес не найден'
            });
        }
    } catch (error) {
        console.error('Geocoding error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка геокодирования: ' + error.message 
        });
    }
});

// API endpoint для получения списка организаций
app.get('/api/organizations', (req, res) => {
    res.json(defaultOrganizations);
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});
