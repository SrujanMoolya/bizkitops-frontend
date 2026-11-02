// Industry-specific modules, defined as data. One definition drives the database check
// constraint, server-side validation and the whole dashboard UI.
// Mirrored in frontend/src/lib/industry-modules.ts - keep the two files identical.

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "currency"
  | "percent"
  | "date"
  | "time"
  | "select"
  | "phone"
  | "email";

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[]; // for select
  placeholder?: string;
  /** show as a column in the records table */
  list?: boolean;
}

export interface EntityDef {
  key: string;
  label: string; // plural, used for tabs
  singular: string;
  titleField: string;
  statusField?: string; // a select field whose value drives the status badge and filter
  amountField?: string; // a currency field totalled on the overview
  /** date field that raises an alert when it falls within `withinDays` (or has passed) */
  alert?: { field: string; label: string; withinDays: number; unlessStatus?: string[] };
  fields: FieldDef[];
}

export interface IndustryModule {
  key: string;
  name: string;
  description: string;
  icon: string; // lucide icon name
  color: "amber" | "emerald" | "blue" | "purple";
  /** words in a business's category that suggest this module in the Module Store */
  keywords: string[];
  entities: EntityDef[];
}

const PAY_MODES = ["Cash", "UPI", "Card", "Bank transfer"];

export const INDUSTRY_MODULES: IndustryModule[] = [
  {
    key: "restaurant",
    name: "Restaurant & Cafe",
    description: "Digital menu, table reservations and kitchen order tickets (KOT) for dine-in, takeaway and delivery.",
    icon: "Utensils",
    color: "emerald",
    keywords: ["restaurant", "cafe", "café", "hotel food", "bakery", "dhaba", "food", "kitchen", "canteen", "cloud kitchen"],
    entities: [
      {
        key: "menu_items",
        label: "Menu",
        singular: "Dish",
        titleField: "name",
        statusField: "availability",
        fields: [
          { key: "name", label: "Dish name", type: "text", required: true, list: true },
          { key: "category", label: "Category", type: "select", options: ["Starters", "Main Course", "Breads", "Rice & Biryani", "Snacks", "Beverages", "Desserts", "Combos"], list: true },
          { key: "food_type", label: "Type", type: "select", options: ["Veg", "Non-veg", "Egg", "Vegan"], list: true },
          { key: "price", label: "Price", type: "currency", required: true, list: true },
          { key: "availability", label: "Availability", type: "select", options: ["Available", "Sold out", "Seasonal"], required: true },
          { key: "description", label: "Description", type: "textarea" },
        ],
      },
      {
        key: "reservations",
        label: "Reservations",
        singular: "Reservation",
        titleField: "guest_name",
        statusField: "status",
        alert: { field: "date", label: "Reservations today/upcoming", withinDays: 1, unlessStatus: ["Completed", "Cancelled", "No-show"] },
        fields: [
          { key: "guest_name", label: "Guest name", type: "text", required: true, list: true },
          { key: "phone", label: "Phone", type: "phone", list: true },
          { key: "party_size", label: "Guests", type: "number", required: true, list: true },
          { key: "date", label: "Date", type: "date", required: true, list: true },
          { key: "time", label: "Time", type: "time", required: true, list: true },
          { key: "table_no", label: "Table", type: "text" },
          { key: "status", label: "Status", type: "select", options: ["Booked", "Seated", "Completed", "Cancelled", "No-show"], required: true },
          { key: "notes", label: "Special requests", type: "textarea" },
        ],
      },
      {
        key: "orders",
        label: "Orders (KOT)",
        singular: "Order",
        titleField: "order_no",
        statusField: "status",
        amountField: "amount",
        fields: [
          { key: "order_no", label: "Order / KOT no.", type: "text", required: true, list: true },
          { key: "order_type", label: "Order type", type: "select", options: ["Dine-in", "Takeaway", "Delivery", "Swiggy", "Zomato"], required: true, list: true },
          { key: "table_no", label: "Table", type: "text", list: true },
          { key: "items", label: "Items", type: "textarea", required: true, placeholder: "2 x Masala Dosa, 1 x Filter Coffee" },
          { key: "amount", label: "Bill amount", type: "currency", required: true, list: true },
          { key: "payment_mode", label: "Payment", type: "select", options: PAY_MODES },
          { key: "status", label: "Status", type: "select", options: ["Received", "Preparing", "Served", "Paid", "Cancelled"], required: true },
        ],
      },
    ],
  },
  {
    key: "salon",
    name: "Salon & Spa",
    description: "Client profiles with hair/skin notes, prepaid packages with session tracking, and stylist records.",
    icon: "Scissors",
    color: "purple",
    keywords: ["salon", "spa", "beauty", "parlour", "parlor", "barber", "makeup", "nail", "unisex"],
    entities: [
      {
        key: "clients",
        label: "Client Profiles",
        singular: "Client",
        titleField: "name",
        fields: [
          { key: "name", label: "Client name", type: "text", required: true, list: true },
          { key: "phone", label: "Phone", type: "phone", required: true, list: true },
          { key: "gender", label: "Gender", type: "select", options: ["Female", "Male", "Other"], list: true },
          { key: "birthday", label: "Birthday", type: "date" },
          { key: "hair_skin_type", label: "Hair / skin type", type: "text", list: true },
          { key: "preferred_stylist", label: "Preferred stylist", type: "text" },
          { key: "last_visit", label: "Last visit", type: "date", list: true },
          { key: "notes", label: "Allergies & preferences", type: "textarea" },
        ],
      },
      {
        key: "packages",
        label: "Packages & Memberships",
        singular: "Package",
        titleField: "client_name",
        statusField: "status",
        amountField: "amount",
        alert: { field: "valid_till", label: "Packages expiring", withinDays: 15, unlessStatus: ["Completed", "Expired"] },
        fields: [
          { key: "client_name", label: "Client", type: "text", required: true, list: true },
          { key: "package_name", label: "Package", type: "text", required: true, list: true, placeholder: "Bridal package / 6 x Hair spa" },
          { key: "sessions_total", label: "Total sessions", type: "number", required: true, list: true },
          { key: "sessions_used", label: "Sessions used", type: "number", list: true },
          { key: "amount", label: "Amount", type: "currency", required: true, list: true },
          { key: "valid_till", label: "Valid till", type: "date", list: true },
          { key: "status", label: "Status", type: "select", options: ["Active", "Completed", "Expired"], required: true },
        ],
      },
      {
        key: "stylists",
        label: "Stylists",
        singular: "Stylist",
        titleField: "name",
        statusField: "status",
        fields: [
          { key: "name", label: "Name", type: "text", required: true, list: true },
          { key: "phone", label: "Phone", type: "phone", list: true },
          { key: "speciality", label: "Speciality", type: "text", list: true, placeholder: "Hair colour, bridal makeup" },
          { key: "commission", label: "Commission", type: "percent", list: true },
          { key: "status", label: "Status", type: "select", options: ["Active", "On leave", "Left"], required: true },
        ],
      },
    ],
  },
  {
    key: "clinic",
    name: "Clinic & Healthcare",
    description: "Patient records, consultations with diagnosis and prescriptions, and follow-up reminders.",
    icon: "Stethoscope",
    color: "blue",
    keywords: ["clinic", "hospital", "doctor", "dental", "dentist", "health", "physio", "diagnostic", "medical", "ayurveda", "homeopathy", "eye"],
    entities: [
      {
        key: "patients",
        label: "Patients",
        singular: "Patient",
        titleField: "name",
        fields: [
          { key: "name", label: "Patient name", type: "text", required: true, list: true },
          { key: "age", label: "Age", type: "number", list: true },
          { key: "gender", label: "Gender", type: "select", options: ["Female", "Male", "Other"], list: true },
          { key: "phone", label: "Phone", type: "phone", required: true, list: true },
          { key: "blood_group", label: "Blood group", type: "select", options: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"], list: true },
          { key: "allergies", label: "Allergies", type: "text" },
          { key: "history", label: "Medical history", type: "textarea" },
        ],
      },
      {
        key: "consultations",
        label: "Consultations",
        singular: "Consultation",
        titleField: "patient_name",
        statusField: "status",
        amountField: "fee",
        alert: { field: "follow_up", label: "Follow-ups due", withinDays: 3 },
        fields: [
          { key: "patient_name", label: "Patient", type: "text", required: true, list: true },
          { key: "date", label: "Date", type: "date", required: true, list: true },
          { key: "complaint", label: "Chief complaint", type: "text", required: true, list: true },
          { key: "diagnosis", label: "Diagnosis", type: "text" },
          { key: "prescription", label: "Prescription", type: "textarea", placeholder: "Tab. Paracetamol 650mg 1-0-1 x 3 days" },
          { key: "fee", label: "Consultation fee", type: "currency", list: true },
          { key: "follow_up", label: "Follow-up date", type: "date", list: true },
          { key: "status", label: "Status", type: "select", options: ["Waiting", "In consultation", "Completed"], required: true },
        ],
      },
    ],
  },
  {
    key: "gym",
    name: "Gym & Fitness",
    description: "Members with plan validity and renewal alerts, trainers, and class schedules.",
    icon: "Dumbbell",
    color: "amber",
    keywords: ["gym", "fitness", "yoga", "crossfit", "zumba", "martial", "dance", "sports", "studio"],
    entities: [
      {
        key: "members",
        label: "Members",
        singular: "Member",
        titleField: "name",
        statusField: "status",
        amountField: "fee",
        alert: { field: "end_date", label: "Memberships expiring", withinDays: 7, unlessStatus: ["Cancelled"] },
        fields: [
          { key: "name", label: "Member name", type: "text", required: true, list: true },
          { key: "phone", label: "Phone", type: "phone", required: true, list: true },
          { key: "plan", label: "Plan", type: "select", options: ["Monthly", "Quarterly", "Half-yearly", "Yearly", "Personal training"], required: true, list: true },
          { key: "start_date", label: "Start date", type: "date", required: true },
          { key: "end_date", label: "End date", type: "date", required: true, list: true },
          { key: "fee", label: "Fee paid", type: "currency", list: true },
          { key: "trainer", label: "Trainer", type: "text" },
          { key: "status", label: "Status", type: "select", options: ["Active", "Frozen", "Expired", "Cancelled"], required: true },
          { key: "notes", label: "Health notes / goals", type: "textarea" },
        ],
      },
      {
        key: "classes",
        label: "Classes",
        singular: "Class",
        titleField: "name",
        statusField: "status",
        fields: [
          { key: "name", label: "Class", type: "text", required: true, list: true, placeholder: "Morning Yoga" },
          { key: "trainer", label: "Trainer", type: "text", list: true },
          { key: "days", label: "Days", type: "text", list: true, placeholder: "Mon, Wed, Fri" },
          { key: "time", label: "Time", type: "time", list: true },
          { key: "capacity", label: "Capacity", type: "number", list: true },
          { key: "status", label: "Status", type: "select", options: ["Running", "Paused"], required: true },
        ],
      },
    ],
  },
  {
    key: "education",
    name: "Coaching & Education",
    description: "Student admissions, batches and timetables, and fee collection with pending-fee tracking.",
    icon: "GraduationCap",
    color: "blue",
    keywords: ["coaching", "tuition", "school", "academy", "institute", "education", "classes", "training", "college", "learning"],
    entities: [
      {
        key: "students",
        label: "Students",
        singular: "Student",
        titleField: "name",
        statusField: "status",
        fields: [
          { key: "name", label: "Student name", type: "text", required: true, list: true },
          { key: "guardian", label: "Parent / guardian", type: "text" },
          { key: "phone", label: "Phone", type: "phone", required: true, list: true },
          { key: "course", label: "Course", type: "text", required: true, list: true },
          { key: "batch", label: "Batch", type: "text", list: true },
          { key: "admission_date", label: "Admission date", type: "date" },
          { key: "status", label: "Status", type: "select", options: ["Active", "Completed", "Dropped"], required: true },
        ],
      },
      {
        key: "batches",
        label: "Batches",
        singular: "Batch",
        titleField: "name",
        statusField: "status",
        fields: [
          { key: "name", label: "Batch name", type: "text", required: true, list: true, placeholder: "Class 10 – Maths – Evening" },
          { key: "course", label: "Course", type: "text", list: true },
          { key: "teacher", label: "Teacher", type: "text", list: true },
          { key: "timing", label: "Timing", type: "text", list: true, placeholder: "Mon–Fri 5–7 PM" },
          { key: "capacity", label: "Seats", type: "number", list: true },
          { key: "start_date", label: "Start date", type: "date" },
          { key: "status", label: "Status", type: "select", options: ["Upcoming", "Running", "Completed"], required: true },
        ],
      },
      {
        key: "fees",
        label: "Fee Collection",
        singular: "Fee entry",
        titleField: "student_name",
        statusField: "status",
        amountField: "amount",
        alert: { field: "due_date", label: "Fees due", withinDays: 5, unlessStatus: ["Paid"] },
        fields: [
          { key: "student_name", label: "Student", type: "text", required: true, list: true },
          { key: "term", label: "Term / instalment", type: "text", list: true, placeholder: "June instalment" },
          { key: "amount", label: "Amount", type: "currency", required: true, list: true },
          { key: "due_date", label: "Due date", type: "date", list: true },
          { key: "paid_on", label: "Paid on", type: "date" },
          { key: "mode", label: "Mode", type: "select", options: PAY_MODES },
          { key: "status", label: "Status", type: "select", options: ["Pending", "Paid", "Partially paid"], required: true },
        ],
      },
    ],
  },
  {
    key: "real_estate",
    name: "Real Estate & Housing",
    description: "Property listings for sale and rent, and buyer site visits through to booking.",
    icon: "Building2",
    color: "purple",
    keywords: ["real estate", "realty", "property", "builder", "developer", "broker", "housing", "construction", "realtor"],
    entities: [
      {
        key: "properties",
        label: "Property Listings",
        singular: "Property",
        titleField: "title",
        statusField: "status",
        amountField: "price",
        fields: [
          { key: "title", label: "Title", type: "text", required: true, list: true, placeholder: "3 BHK, Kadri Hills" },
          { key: "property_type", label: "Type", type: "select", options: ["Apartment", "Villa", "Independent house", "Plot", "Commercial", "Office"], required: true, list: true },
          { key: "deal", label: "Deal", type: "select", options: ["Sale", "Rent", "Lease"], required: true, list: true },
          { key: "location", label: "Location", type: "text", required: true, list: true },
          { key: "area_sqft", label: "Area (sq ft)", type: "number", list: true },
          { key: "bedrooms", label: "Bedrooms", type: "number" },
          { key: "price", label: "Price / rent", type: "currency", required: true, list: true },
          { key: "owner_contact", label: "Owner contact", type: "phone" },
          { key: "status", label: "Status", type: "select", options: ["Available", "Under offer", "Sold", "Rented"], required: true },
          { key: "description", label: "Description", type: "textarea" },
        ],
      },
      {
        key: "site_visits",
        label: "Site Visits",
        singular: "Site visit",
        titleField: "client_name",
        statusField: "status",
        alert: { field: "visit_date", label: "Upcoming site visits", withinDays: 2, unlessStatus: ["Visited", "Not interested", "Booked", "Cancelled"] },
        fields: [
          { key: "client_name", label: "Client", type: "text", required: true, list: true },
          { key: "phone", label: "Phone", type: "phone", required: true, list: true },
          { key: "property", label: "Property", type: "text", required: true, list: true },
          { key: "visit_date", label: "Visit date", type: "date", required: true, list: true },
          { key: "budget", label: "Budget", type: "currency" },
          { key: "status", label: "Status", type: "select", options: ["Scheduled", "Visited", "Interested", "Not interested", "Booked", "Cancelled"], required: true },
          { key: "notes", label: "Notes", type: "textarea" },
        ],
      },
    ],
  },
  {
    key: "finance",
    name: "Finance & Lending",
    description: "Loan applications through disbursement, EMI schedules with due alerts, and collection entries.",
    icon: "Landmark",
    color: "blue",
    keywords: ["finance", "loan", "lending", "microfinance", "nbfc", "chit", "credit", "gold loan", "money"],
    entities: [
      {
        key: "loans",
        label: "Loans",
        singular: "Loan",
        titleField: "borrower",
        statusField: "status",
        amountField: "principal",
        alert: { field: "next_due", label: "EMIs due", withinDays: 3, unlessStatus: ["Closed", "Applied", "Rejected"] },
        fields: [
          { key: "borrower", label: "Borrower", type: "text", required: true, list: true },
          { key: "phone", label: "Phone", type: "phone", required: true },
          { key: "loan_type", label: "Loan type", type: "select", options: ["Personal", "Business", "Gold", "Vehicle", "Home", "Education"], required: true, list: true },
          { key: "principal", label: "Principal", type: "currency", required: true, list: true },
          { key: "interest_rate", label: "Interest rate (p.a.)", type: "percent", required: true },
          { key: "tenure_months", label: "Tenure (months)", type: "number", required: true },
          { key: "emi", label: "EMI", type: "currency", list: true },
          { key: "start_date", label: "Start date", type: "date" },
          { key: "next_due", label: "Next EMI due", type: "date", list: true },
          { key: "status", label: "Status", type: "select", options: ["Applied", "Approved", "Disbursed", "Closed", "Defaulted", "Rejected"], required: true },
        ],
      },
      {
        key: "collections",
        label: "EMI Collections",
        singular: "Collection",
        titleField: "borrower",
        statusField: "mode",
        amountField: "amount",
        fields: [
          { key: "borrower", label: "Borrower", type: "text", required: true, list: true },
          { key: "loan_ref", label: "Loan ref.", type: "text", list: true },
          { key: "amount", label: "Amount", type: "currency", required: true, list: true },
          { key: "date", label: "Date", type: "date", required: true, list: true },
          { key: "mode", label: "Mode", type: "select", options: PAY_MODES, required: true },
          { key: "notes", label: "Notes", type: "text" },
        ],
      },
    ],
  },
  {
    key: "hotel",
    name: "Hotel & Homestay",
    description: "Room inventory with housekeeping status, guest bookings, check-in/check-out and OTA source tracking.",
    icon: "BedDouble",
    color: "emerald",
    keywords: ["hotel", "homestay", "resort", "lodge", "guest house", "hostel", "stay", "inn", "pg", "villa stay"],
    entities: [
      {
        key: "rooms",
        label: "Rooms",
        singular: "Room",
        titleField: "room_no",
        statusField: "status",
        fields: [
          { key: "room_no", label: "Room no.", type: "text", required: true, list: true },
          { key: "room_type", label: "Type", type: "select", options: ["Standard", "Deluxe", "Suite", "Family", "Dormitory"], required: true, list: true },
          { key: "rate", label: "Rate / night", type: "currency", required: true, list: true },
          { key: "capacity", label: "Max guests", type: "number", list: true },
          { key: "status", label: "Status", type: "select", options: ["Available", "Occupied", "Cleaning", "Maintenance"], required: true },
          { key: "amenities", label: "Amenities", type: "text", placeholder: "AC, Wi-Fi, Balcony" },
        ],
      },
      {
        key: "bookings",
        label: "Bookings",
        singular: "Booking",
        titleField: "guest_name",
        statusField: "status",
        amountField: "amount",
        alert: { field: "check_in", label: "Arrivals", withinDays: 1, unlessStatus: ["Checked in", "Checked out", "Cancelled"] },
        fields: [
          { key: "guest_name", label: "Guest", type: "text", required: true, list: true },
          { key: "phone", label: "Phone", type: "phone", required: true },
          { key: "room_no", label: "Room", type: "text", list: true },
          { key: "check_in", label: "Check-in", type: "date", required: true, list: true },
          { key: "check_out", label: "Check-out", type: "date", required: true, list: true },
          { key: "guests", label: "Guests", type: "number" },
          { key: "amount", label: "Amount", type: "currency", list: true },
          { key: "source", label: "Source", type: "select", options: ["Direct", "Walk-in", "Booking.com", "MakeMyTrip", "Goibibo", "Airbnb", "Agoda"] },
          { key: "status", label: "Status", type: "select", options: ["Reserved", "Checked in", "Checked out", "Cancelled"], required: true },
          { key: "id_proof", label: "ID proof", type: "text", placeholder: "Aadhaar / Passport no." },
        ],
      },
    ],
  },
  {
    key: "pharmacy",
    name: "Pharmacy & Medical Store",
    description: "Medicine stock by batch with expiry alerts and schedule tracking, and prescription dispensing.",
    icon: "Pill",
    color: "emerald",
    keywords: ["pharmacy", "medical store", "chemist", "medicals", "drug", "medicine", "druggist"],
    entities: [
      {
        key: "medicines",
        label: "Medicine Stock",
        singular: "Medicine",
        titleField: "name",
        statusField: "schedule",
        alert: { field: "expiry", label: "Expiring medicines", withinDays: 60 },
        fields: [
          { key: "name", label: "Medicine", type: "text", required: true, list: true, placeholder: "Dolo 650" },
          { key: "salt", label: "Composition", type: "text", placeholder: "Paracetamol 650mg" },
          { key: "batch_no", label: "Batch no.", type: "text", required: true, list: true },
          { key: "expiry", label: "Expiry", type: "date", required: true, list: true },
          { key: "quantity", label: "Quantity", type: "number", required: true, list: true },
          { key: "mrp", label: "MRP", type: "currency", required: true, list: true },
          { key: "schedule", label: "Schedule", type: "select", options: ["OTC", "Schedule H", "Schedule H1", "Schedule X"], required: true },
          { key: "rack", label: "Rack / shelf", type: "text" },
        ],
      },
      {
        key: "prescriptions",
        label: "Prescriptions",
        singular: "Prescription",
        titleField: "patient_name",
        statusField: "status",
        amountField: "amount",
        fields: [
          { key: "patient_name", label: "Patient", type: "text", required: true, list: true },
          { key: "doctor", label: "Doctor", type: "text", list: true },
          { key: "date", label: "Date", type: "date", required: true, list: true },
          { key: "medicines", label: "Medicines", type: "textarea", required: true },
          { key: "amount", label: "Amount", type: "currency", list: true },
          { key: "status", label: "Status", type: "select", options: ["Pending", "Dispensed", "Partially dispensed"], required: true },
        ],
      },
    ],
  },
  {
    key: "repair",
    name: "Repair & Service Centre",
    description: "Job cards for devices and vehicles - intake, diagnosis, estimates, technician assignment and delivery.",
    icon: "Wrench",
    color: "amber",
    keywords: ["repair", "service centre", "service center", "mobile repair", "garage", "workshop", "mechanic", "laptop", "electronics", "ac service"],
    entities: [
      {
        key: "job_cards",
        label: "Job Cards",
        singular: "Job card",
        titleField: "job_no",
        statusField: "status",
        amountField: "estimate",
        alert: { field: "promised_date", label: "Jobs due for delivery", withinDays: 1, unlessStatus: ["Delivered", "Cancelled"] },
        fields: [
          { key: "job_no", label: "Job no.", type: "text", required: true, list: true },
          { key: "customer", label: "Customer", type: "text", required: true, list: true },
          { key: "phone", label: "Phone", type: "phone", required: true },
          { key: "item", label: "Device / vehicle", type: "text", required: true, list: true, placeholder: "iPhone 13 / KA-20-AB-1234" },
          { key: "issue", label: "Reported issue", type: "textarea", required: true },
          { key: "estimate", label: "Estimate", type: "currency", list: true },
          { key: "technician", label: "Technician", type: "text" },
          { key: "promised_date", label: "Promised by", type: "date", list: true },
          { key: "status", label: "Status", type: "select", options: ["Received", "Diagnosing", "Waiting for parts", "In repair", "Ready", "Delivered", "Cancelled"], required: true },
        ],
      },
    ],
  },
  {
    key: "events",
    name: "Events & Catering",
    description: "Event bookings with venue, guest count, package and advance tracking from enquiry to completion.",
    icon: "PartyPopper",
    color: "purple",
    keywords: ["event", "wedding", "catering", "caterer", "decor", "photography", "photo studio", "planner", "banquet", "dj"],
    entities: [
      {
        key: "events",
        label: "Events",
        singular: "Event",
        titleField: "client",
        statusField: "status",
        amountField: "package_amount",
        alert: { field: "event_date", label: "Upcoming events", withinDays: 7, unlessStatus: ["Completed", "Cancelled"] },
        fields: [
          { key: "client", label: "Client", type: "text", required: true, list: true },
          { key: "phone", label: "Phone", type: "phone", required: true },
          { key: "event_type", label: "Event type", type: "select", options: ["Wedding", "Engagement", "Birthday", "Corporate", "Naming ceremony", "Housewarming", "Other"], required: true, list: true },
          { key: "event_date", label: "Event date", type: "date", required: true, list: true },
          { key: "venue", label: "Venue", type: "text", list: true },
          { key: "guests", label: "Guests", type: "number" },
          { key: "package_amount", label: "Package amount", type: "currency", list: true },
          { key: "advance_paid", label: "Advance paid", type: "currency" },
          { key: "status", label: "Status", type: "select", options: ["Enquiry", "Confirmed", "Completed", "Cancelled"], required: true },
          { key: "requirements", label: "Requirements", type: "textarea" },
        ],
      },
    ],
  },
  {
    key: "logistics",
    name: "Courier & Logistics",
    description: "Shipment booking with tracking numbers, weights and charges, through to delivery or return.",
    icon: "Truck",
    color: "amber",
    keywords: ["courier", "logistics", "transport", "cargo", "parcel", "delivery", "packers", "movers", "freight"],
    entities: [
      {
        key: "shipments",
        label: "Shipments",
        singular: "Shipment",
        titleField: "tracking_no",
        statusField: "status",
        amountField: "charges",
        fields: [
          { key: "tracking_no", label: "Tracking no.", type: "text", required: true, list: true },
          { key: "sender", label: "Sender", type: "text", required: true },
          { key: "receiver", label: "Receiver", type: "text", required: true, list: true },
          { key: "receiver_phone", label: "Receiver phone", type: "phone" },
          { key: "destination", label: "Destination", type: "text", required: true, list: true },
          { key: "weight_kg", label: "Weight (kg)", type: "number", list: true },
          { key: "charges", label: "Charges", type: "currency", required: true, list: true },
          { key: "dispatch_date", label: "Dispatch date", type: "date", list: true },
          { key: "status", label: "Status", type: "select", options: ["Booked", "In transit", "Out for delivery", "Delivered", "Returned"], required: true },
        ],
      },
    ],
  },
];

export const INDUSTRY_MODULE_KEYS = INDUSTRY_MODULES.map((m) => m.key);

export function getIndustryModule(key: string) {
  return INDUSTRY_MODULES.find((m) => m.key === key);
}

export function getEntity(moduleKey: string, entityKey: string) {
  return getIndustryModule(moduleKey)?.entities.find((e) => e.key === entityKey);
}
