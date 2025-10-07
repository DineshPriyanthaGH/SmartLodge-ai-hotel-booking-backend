require('dotenv').config();
const mongoose = require('mongoose');
const Hotel = require('./models/Hotel');

// Sample hotels data
const sampleHotels = [
  {
    name: "Grand Palace Hotel",
    description: "Experience luxury at its finest in our Grand Palace Hotel. Located in the heart of the city, we offer world-class amenities, exceptional service, and breathtaking views. Our elegantly appointed rooms and suites provide the perfect retreat for both business and leisure travelers.",
    shortDescription: "Luxury hotel in the city center with world-class amenities and exceptional service.",
    location: {
      address: "123 Main Street, Downtown",
      city: "New York",
      state: "New York",
      country: "United States",
      zipCode: "10001",
      coordinates: {
        latitude: 40.7128,
        longitude: -74.0060
      }
    },
    contact: {
      phone: "+1-212-555-0123",
      email: "info@grandpalacehotel.com",
      website: "https://grandpalacehotel.com"
    },
    images: [
      {
        url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
        alt: "Grand Palace Hotel Exterior",
        isPrimary: true,
        category: "exterior"
      },
      {
        url: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800",
        alt: "Luxury Hotel Lobby",
        category: "lobby"
      },
      {
        url: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800",
        alt: "Deluxe Room",
        category: "room"
      }
    ],
    rating: {
      overall: 4.8,
      breakdown: {
        cleanliness: 4.9,
        service: 4.8,
        location: 4.7,
        value: 4.6,
        amenities: 4.9
      },
      reviewCount: 1247
    },
    pricing: {
      basePrice: 299,
      currency: "USD",
      taxRate: 0.12,
      serviceCharge: 25
    },
    amenities: [
      { name: "Free WiFi", category: "general" },
      { name: "Fitness Center", category: "wellness" },
      { name: "Swimming Pool", category: "wellness" },
      { name: "Spa Services", category: "wellness", additionalCost: 100 },
      { name: "24/7 Room Service", category: "general" },
      { name: "Business Center", category: "business" },
      { name: "Valet Parking", category: "transportation", additionalCost: 35 },
      { name: "Concierge Service", category: "general" }
    ],
    roomTypes: [
      {
        name: "Standard Queen Room",
        description: "Comfortable room with queen bed and city views",
        maxOccupancy: 2,
        bedConfiguration: "1 Queen Bed",
        size: { squareFeet: 350, squareMeters: 32.5 },
        amenities: ["Free WiFi", "Air Conditioning", "Flat Screen TV", "Mini Fridge"],
        priceAdjustment: 0,
        totalRooms: 50,
        availableRooms: 45
      },
      {
        name: "Deluxe King Suite",
        description: "Spacious suite with king bed and separate living area",
        maxOccupancy: 4,
        bedConfiguration: "1 King Bed + Sofa Bed",
        size: { squareFeet: 650, squareMeters: 60.4 },
        amenities: ["Free WiFi", "Air Conditioning", "Flat Screen TV", "Mini Bar", "Balcony"],
        priceAdjustment: 150,
        totalRooms: 25,
        availableRooms: 20
      },
      {
        name: "Presidential Suite",
        description: "Ultimate luxury with panoramic city views and premium amenities",
        maxOccupancy: 6,
        bedConfiguration: "1 King Bed + 2 Queen Beds",
        size: { squareFeet: 1200, squareMeters: 111.5 },
        amenities: ["Free WiFi", "Air Conditioning", "Flat Screen TV", "Mini Bar", "Balcony", "Butler Service"],
        priceAdjustment: 500,
        totalRooms: 5,
        availableRooms: 3
      }
    ],
    policies: {
      checkIn: { time: "15:00" },
      checkOut: { time: "11:00" },
      cancellation: "moderate",
      children: { allowed: true, ageLimit: 18, additionalCharge: 0 },
      pets: { allowed: false },
      smoking: "no-smoking"
    },
    status: "active",
    featured: true,
    owner: {
      name: "Grand Hotels Group",
      contact: {
        email: "management@grandhotelsgroup.com",
        phone: "+1-212-555-0100"
      }
    }
  },
  {
    name: "Ocean Breeze Resort",
    description: "Escape to paradise at Ocean Breeze Resort, where pristine beaches meet luxury accommodation. Our beachfront property offers stunning ocean views, world-class dining, and endless recreational activities for the perfect tropical getaway.",
    shortDescription: "Beachfront resort with stunning ocean views and tropical luxury.",
    location: {
      address: "456 Beach Boulevard",
      city: "Miami",
      state: "Florida",
      country: "United States",
      zipCode: "33101",
      coordinates: {
        latitude: 25.7617,
        longitude: -80.1918
      }
    },
    contact: {
      phone: "+1-305-555-0456",
      email: "reservations@oceanbreezeresort.com",
      website: "https://oceanbreezeresort.com"
    },
    images: [
      {
        url: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800",
        alt: "Ocean Breeze Resort Beachfront",
        isPrimary: true,
        category: "exterior"
      },
      {
        url: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800",
        alt: "Resort Pool Area",
        category: "amenity"
      },
      {
        url: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800",
        alt: "Ocean View Room",
        category: "room"
      }
    ],
    rating: {
      overall: 4.6,
      breakdown: {
        cleanliness: 4.7,
        service: 4.5,
        location: 4.9,
        value: 4.4,
        amenities: 4.6
      },
      reviewCount: 892
    },
    pricing: {
      basePrice: 199,
      currency: "USD",
      taxRate: 0.13,
      serviceCharge: 20
    },
    amenities: [
      { name: "Private Beach", category: "entertainment" },
      { name: "Outdoor Pool", category: "wellness" },
      { name: "Water Sports", category: "entertainment", additionalCost: 50 },
      { name: "Spa & Wellness Center", category: "wellness", additionalCost: 80 },
      { name: "Multiple Restaurants", category: "dining" },
      { name: "Beach Bar", category: "dining" },
      { name: "Free WiFi", category: "general" },
      { name: "Fitness Center", category: "wellness" }
    ],
    roomTypes: [
      {
        name: "Garden View Room",
        description: "Comfortable room overlooking tropical gardens",
        maxOccupancy: 2,
        bedConfiguration: "2 Double Beds",
        size: { squareFeet: 400, squareMeters: 37.2 },
        amenities: ["Free WiFi", "Air Conditioning", "Flat Screen TV", "Coffee Maker"],
        priceAdjustment: 0,
        totalRooms: 60,
        availableRooms: 55
      },
      {
        name: "Ocean View Suite",
        description: "Spacious suite with breathtaking ocean views",
        maxOccupancy: 4,
        bedConfiguration: "1 King Bed + Sofa Bed",
        size: { squareFeet: 600, squareMeters: 55.7 },
        amenities: ["Free WiFi", "Air Conditioning", "Flat Screen TV", "Mini Bar", "Private Balcony"],
        priceAdjustment: 100,
        totalRooms: 30,
        availableRooms: 25
      },
      {
        name: "Beachfront Villa",
        description: "Private villa with direct beach access",
        maxOccupancy: 6,
        bedConfiguration: "2 King Beds + Living Area",
        size: { squareFeet: 1000, squareMeters: 92.9 },
        amenities: ["Free WiFi", "Air Conditioning", "Flat Screen TV", "Full Kitchen", "Private Beach Access"],
        priceAdjustment: 300,
        totalRooms: 10,
        availableRooms: 8
      }
    ],
    policies: {
      checkIn: { time: "16:00" },
      checkOut: { time: "11:00" },
      cancellation: "flexible",
      children: { allowed: true, ageLimit: 12, additionalCharge: 25 },
      pets: { allowed: false },
      smoking: "designated-areas"
    },
    status: "active",
    featured: true,
    owner: {
      name: "Tropical Resorts International",
      contact: {
        email: "info@tropicalresorts.com",
        phone: "+1-305-555-0200"
      }
    }
  },
  {
    name: "Mountain View Lodge",
    description: "Nestled in the heart of the Rocky Mountains, Mountain View Lodge offers a perfect blend of rustic charm and modern comfort. Enjoy hiking, skiing, and breathtaking mountain scenery in this cozy mountain retreat.",
    shortDescription: "Cozy mountain lodge with rustic charm and outdoor adventures.",
    location: {
      address: "789 Mountain Pass Road",
      city: "Aspen",
      state: "Colorado",
      country: "United States",
      zipCode: "81611",
      coordinates: {
        latitude: 39.1911,
        longitude: -106.8175
      }
    },
    contact: {
      phone: "+1-970-555-0789",
      email: "info@mountainviewlodge.com",
      website: "https://mountainviewlodge.com"
    },
    images: [
      {
        url: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800",
        alt: "Mountain View Lodge Exterior",
        isPrimary: true,
        category: "exterior"
      },
      {
        url: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800",
        alt: "Cozy Lodge Interior",
        category: "lobby"
      },
      {
        url: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800",
        alt: "Mountain View Room",
        category: "room"
      }
    ],
    rating: {
      overall: 4.4,
      breakdown: {
        cleanliness: 4.5,
        service: 4.6,
        location: 4.8,
        value: 4.2,
        amenities: 4.1
      },
      reviewCount: 654
    },
    pricing: {
      basePrice: 159,
      currency: "USD",
      taxRate: 0.08,
      serviceCharge: 15
    },
    amenities: [
      { name: "Ski Storage", category: "general" },
      { name: "Hot Tub", category: "wellness" },
      { name: "Fireplace Lounge", category: "general" },
      { name: "Equipment Rental", category: "entertainment", additionalCost: 40 },
      { name: "Hiking Trails Access", category: "entertainment" },
      { name: "Free WiFi", category: "general" },
      { name: "Restaurant", category: "dining" },
      { name: "Game Room", category: "entertainment" }
    ],
    roomTypes: [
      {
        name: "Standard Mountain Room",
        description: "Cozy room with mountain views and rustic decor",
        maxOccupancy: 2,
        bedConfiguration: "1 Queen Bed",
        size: { squareFeet: 300, squareMeters: 27.9 },
        amenities: ["Free WiFi", "Heating", "Flat Screen TV", "Coffee Maker"],
        priceAdjustment: 0,
        totalRooms: 40,
        availableRooms: 35
      },
      {
        name: "Family Cabin",
        description: "Spacious cabin perfect for families with bunk beds",
        maxOccupancy: 6,
        bedConfiguration: "1 Queen Bed + 2 Bunk Beds",
        size: { squareFeet: 500, squareMeters: 46.5 },
        amenities: ["Free WiFi", "Heating", "Flat Screen TV", "Mini Fridge", "Fireplace"],
        priceAdjustment: 80,
        totalRooms: 20,
        availableRooms: 18
      },
      {
        name: "Luxury Mountain Suite",
        description: "Premium suite with panoramic mountain views",
        maxOccupancy: 4,
        bedConfiguration: "1 King Bed + Living Area",
        size: { squareFeet: 700, squareMeters: 65.0 },
        amenities: ["Free WiFi", "Heating", "Flat Screen TV", "Mini Bar", "Private Balcony", "Fireplace"],
        priceAdjustment: 120,
        totalRooms: 15,
        availableRooms: 12
      }
    ],
    policies: {
      checkIn: { time: "15:00" },
      checkOut: { time: "10:00" },
      cancellation: "moderate",
      children: { allowed: true, ageLimit: 16, additionalCharge: 0 },
      pets: { allowed: true, additionalCharge: 30 },
      smoking: "no-smoking"
    },
    status: "active",
    featured: false,
    owner: {
      name: "Rocky Mountain Hospitality",
      contact: {
        email: "reservations@rockymountainhospitality.com",
        phone: "+1-970-555-0300"
      }
    }
  }
];

// Connect to MongoDB and seed hotels
async function seedHotels() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing hotels (optional - remove if you want to keep existing data)
    console.log('🗑️ Clearing existing hotels...');
    await Hotel.deleteMany({});
    console.log('✅ Existing hotels cleared');

    // Insert sample hotels
    console.log('🏨 Inserting sample hotels...');
    const insertedHotels = await Hotel.insertMany(sampleHotels);
    console.log(`✅ Successfully inserted ${insertedHotels.length} hotels:`);
    
    insertedHotels.forEach((hotel, index) => {
      console.log(`   ${index + 1}. ${hotel.name} (ID: ${hotel._id})`);
    });

    console.log('\n📊 Hotel seeding completed successfully!');
    console.log(`🌐 You can now view these hotels at: http://localhost:3000`);
    
  } catch (error) {
    console.error('❌ Error seeding hotels:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the seeder
if (require.main === module) {
  seedHotels();
}

module.exports = seedHotels;