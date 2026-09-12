export type VehicleType = "car" | "bike";
export type FuelType = "petrol" | "diesel" | "electric" | "cng";
export type TransmissionType = "manual" | "automatic";
export type BodyType = "suv" | "sedan" | "hatchback" | "sports" | "cruiser" | "commuter" | "adventure";
export type OwnerType = "first" | "second" | "third" | "fourth+";

export interface Vehicle {
  id: string;
  type: VehicleType;
  name: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  kmDriven: number;
  fuelType: FuelType;
  transmission?: TransmissionType;
  bodyType: BodyType;
  ownerType: OwnerType;
  location: string;
  images: string[];
  specifications: {
    engineCapacity: string;
    mileage: string;
    registrationState: string;
    insuranceValidity: string;
    rcStatus: string;
  };
  features: string[];
  description: string;
  createdAt: string;
}

export const carBrands = [
  "Porsche",
  "BMW",
  "Mercedes-Benz",
  "Audi",
  "Lamborghini",
  "Ferrari",
  "Aston Martin",
  "Jaguar",
  "Land Rover",
  "Rolls-Royce",
  "Bentley",
  "Maserati",
  "Bugatti",
  "McLaren",
  "Tesla",
  "Toyota",
  "Hyundai",
  "Tata",
  "Mahindra",
  "Kia",
  "Honda",
  "Volkswagen",
  "Skoda",
  "MG",
  "Nissan",
  "Ford",
];

export const bikeBrands = [
  "Royal Enfield",
  "Harley-Davidson",
  "Ducati",
  "BMW",
  "Kawasaki",
  "Yamaha",
  "Suzuki",
  "Honda",
  "TVS",
  "Bajaj",
  "Hero",
  "KTM",
  "Triumph",
  "Aprilia",
  "MV Agusta",
  "Benelli",
  "Husqvarna",
  "Indian Motorcycle",
  "Moto Guzzi",
  "Norton",
  "Bimota",
  "Hyosung",
  "Jawa",
  "Yezdi",
  "Ather",
  "Ola Electric",
  "Revolt",
  "Ultraviolette",
];

export const locations = ["Bangalore", "Mumbai", "Delhi", "Hyderabad", "Pune"];

export const formatPrice = (price: number): string => {
  if (price >= 10000000) {
    return `₹${(price / 10000000).toFixed(2)} Cr`;
  } else if (price >= 100000) {
    return `₹${(price / 100000).toFixed(2)} Lakh`;
  } else {
    return `₹${price.toLocaleString("en-IN")}`;
  }
};

export const formatKm = (km: number): string => {
  if (km >= 1000) {
    return `${(km / 1000).toFixed(0)}k km`;
  }
  return `${km} km`;
};
