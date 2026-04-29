export interface TravelDeal {
  id: string;
  title: string;
  description: string;
  url: string;
  imageEmoji: string;
  tag: string;
  destination: string;
}

// Manually curated travel deals — update periodically with genuine offers.
// Booking.com affiliate partner ID: used in URL construction.
const BOOKING_AFF = "aid=2345678"; // replace with real affiliate ID from Booking.com

export const TRAVEL_DEALS: TravelDeal[] = [
  {
    id: "travel-bali-2025",
    title: "Bali Beach Resorts from $89/night",
    description: "Top-rated resorts near Seminyak and Ubud with free cancellation.",
    url: `https://www.booking.com/searchresults.en-gb.html?ss=Bali&${BOOKING_AFF}`,
    imageEmoji: "🌴",
    tag: "Free cancellation",
    destination: "Bali, Indonesia",
  },
  {
    id: "travel-tokyo-2025",
    title: "Tokyo Hotels from $110/night",
    description: "Central Shinjuku and Shibuya hotels with excellent ratings.",
    url: `https://www.booking.com/searchresults.en-gb.html?ss=Tokyo&${BOOKING_AFF}`,
    imageEmoji: "🗼",
    tag: "Best value",
    destination: "Tokyo, Japan",
  },
  {
    id: "travel-phuket-2025",
    title: "Phuket Beachfront Villas from $95/night",
    description: "Private pool villas on Patong and Kata Beach.",
    url: `https://www.booking.com/searchresults.en-gb.html?ss=Phuket&${BOOKING_AFF}`,
    imageEmoji: "🏖️",
    tag: "Beachfront",
    destination: "Phuket, Thailand",
  },
  {
    id: "travel-singapore-2025",
    title: "Singapore City Hotels from $120/night",
    description: "Marina Bay and Orchard Road hotels — perfect for a weekend escape.",
    url: `https://www.booking.com/searchresults.en-gb.html?ss=Singapore&${BOOKING_AFF}`,
    imageEmoji: "🌆",
    tag: "City break",
    destination: "Singapore",
  },
  {
    id: "travel-maldives-2025",
    title: "Maldives Overwater Bungalows from $320/night",
    description: "All-inclusive overwater bungalows with house reef snorkelling.",
    url: `https://www.booking.com/searchresults.en-gb.html?ss=Maldives&${BOOKING_AFF}`,
    imageEmoji: "🤿",
    tag: "Luxury",
    destination: "Maldives",
  },
];
