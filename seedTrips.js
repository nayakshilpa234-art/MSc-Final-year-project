const mongoose = require('mongoose');
const TripPlan = require('./backend/models/TripPlan');

mongoose.connect('mongodb://localhost:27017/ai-tourist').then(async () => {
  await TripPlan.deleteMany({});
  const trips = [
    { type: 'Family Trip', destination: 'Disney World, Florida', duration: '1 Week Trip', price: 1500 },
    { type: 'Friends Trip', destination: 'Las Vegas, Nevada', duration: '3 Day Trip', price: 800 },
    { type: 'Vacation Trip', destination: 'Maldives', duration: '1 Week Trip', price: 3000 },
    { type: 'Couple Trip', destination: 'Paris, France', duration: '4 Day Trip', price: 2000 },
    { type: 'Family Trip', destination: 'Yellowstone, Wyoming', duration: '3 Day Trip', price: 1200 },
    { type: 'Friends Trip', destination: 'Ibiza, Spain', duration: '2 Day Trip', price: 1800 }
  ];
  await TripPlan.insertMany(trips);
  console.log('Successfully seeded TripPlans collection.');
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
