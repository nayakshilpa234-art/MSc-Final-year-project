const mongoose = require('mongoose');
const TripPlan = require('./models/TripPlan');

mongoose.connect('mongodb://localhost:27017/ai-tourist').then(async () => {
  await TripPlan.deleteMany({});
  const trips = [
    { type: 'Family Trip', destination: 'Disney World, Florida', duration: '1 Week Trip', price: 125000 },
    { type: 'Friends Trip', destination: 'Las Vegas, Nevada', duration: '3 Day Trip', price: 65000 },
    { type: 'Vacation Trip', destination: 'Maldives', duration: '1 Week Trip', price: 250000 },
    { type: 'Couple Trip', destination: 'Paris, France', duration: '4 Day Trip', price: 165000 },
    { type: 'Family Trip', destination: 'Yellowstone, Wyoming', duration: '3 Day Trip', price: 95000 },
    { type: 'Friends Trip', destination: 'Ibiza, Spain', duration: '2 Day Trip', price: 145000 }
  ];
  await TripPlan.insertMany(trips);
  console.log('Successfully seeded TripPlans collection.');
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
