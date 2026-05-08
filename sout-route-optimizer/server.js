const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.json());
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

// API endpoint для получения списка организаций
app.get('/api/organizations', (req, res) => {
    res.json(defaultOrganizations);
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});
