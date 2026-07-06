import { travelColors } from "../lib/theme";
import type { ActivitySuggestion, ExpenseItem, Trip, TravelFolder } from "../lib/types";
import { weekendSeeds } from "./database";
import type { WeekendSeed } from "./database";

interface WeekendActivity extends ActivitySuggestion {
  coordinates: [number, number];
}

const weekendActivities: Record<string, ActivitySuggestion[]> = {
  Seoul: [
    { title: "Palais et quartiers historiques", description: "Gyeongbokgung, Bukchon Hanok Village et balade entre maisons traditionnelles.", sourceLabel: "Visit Seoul", sourceUrl: "https://english.visitseoul.net/attractions", coordinates: [37.5796, 126.977] },
    { title: "Marche et street food", description: "Gwangjang Market pour un format facile en soiree de weekend.", sourceLabel: "Visit Seoul", sourceUrl: "https://english.visitseoul.net/attractions", coordinates: [37.5701, 126.9997] },
    { title: "Vue et sortie nocturne", description: "N Seoul Tower, Myeongdong ou Hongdae selon l'energie.", sourceLabel: "Visit Seoul", sourceUrl: "https://english.visitseoul.net/attractions", coordinates: [37.5512, 126.9882] },
  ],
  Tokyo: [
    { title: "Shinjuku et jardins", description: "Shinjuku Gyoen puis soiree autour de Shinjuku.", sourceLabel: "GO TOKYO", sourceUrl: "https://www.gotokyo.org/en/index.html", coordinates: [35.6852, 139.7101] },
    { title: "Marches et culture urbaine", description: "Tsukiji Outer Market, Tokyo Station et Ginza en parcours compact.", sourceLabel: "Japan Travel", sourceUrl: "https://www.japan.travel/en/destinations/kanto/tokyo/", coordinates: [35.6655, 139.7707] },
    { title: "Sanctuaire et quartiers jeunes", description: "Meiji Shrine, Harajuku et Omotesando pour une demi-journee fluide.", sourceLabel: "GO TOKYO", sourceUrl: "https://www.gotokyo.org/en/index.html", coordinates: [35.6764, 139.6993] },
  ],
  Hanoi: [
    { title: "Old Quarter et street food", description: "Balade dans le vieux quartier avec pho, bun cha et cafes.", sourceLabel: "Vietnam Travel", sourceUrl: "https://vietnam.travel/places-to-go/northern-vietnam/ha-noi", coordinates: [21.0359, 105.8501] },
    { title: "Hoan Kiem et Ngoc Son", description: "Boucle calme autour du lac, pratique en debut ou fin de journee.", sourceLabel: "Vietnam Travel", sourceUrl: "https://vietnam.travel/places-to-go/northern-vietnam/ha-noi", coordinates: [21.0287, 105.8521] },
    { title: "Temple of Literature et spectacle", description: "Patrimoine en journee puis water puppet show le soir.", sourceLabel: "GetYourGuide Hanoi", sourceUrl: "https://www.getyourguide.com/hanoi-l205/ttd/", coordinates: [21.028, 105.8356] },
  ],
  Singapour: [
    { title: "Gardens by the Bay", description: "Supertree Grove, Cloud Forest ou Flower Dome selon budget et chaleur.", sourceLabel: "Visit Singapore", sourceUrl: "https://www.visitsingapore.com/", coordinates: [1.2816, 103.8636] },
    { title: "Marina Bay a pied", description: "Waterfront, skyline et soiree autour de Marina Bay.", sourceLabel: "Visit Singapore", sourceUrl: "https://www.visitsingapore.com/", coordinates: [1.2847, 103.861] },
    { title: "Quartiers food", description: "Bugis, Chinatown, Little India ou hawker centre pour optimiser un weekend.", sourceLabel: "Visit Singapore", sourceUrl: "https://www.visitsingapore.com/", coordinates: [1.2836, 103.8435] },
  ],
  Manille: [
    { title: "Intramuros et Fort Santiago", description: "Coeur historique compact, ideal pour une premiere demi-journee.", sourceLabel: "Tripadvisor Manila", sourceUrl: "https://www.tripadvisor.com/Attractions-g298573-Activities-Manila_Metro_Manila_Luzon.html", coordinates: [14.5955, 120.9708] },
    { title: "Rizal Park et musees", description: "Parcours patrimonial simple autour du centre de Manille.", sourceLabel: "Tripadvisor Manila", sourceUrl: "https://www.tripadvisor.com/Attractions-g298573-Activities-Manila_Metro_Manila_Luzon.html", coordinates: [14.5826, 120.9787] },
    { title: "Makati ou Binondo", description: "Soiree food, marche ou quartier plus vivant selon logement.", sourceLabel: "Expedia Manila", sourceUrl: "https://www.expedia.com/Things-To-Do-In-Manila.d178282.Travel-Guide-Activities", coordinates: [14.6007, 120.9745] },
  ],
  "Hong Kong": [
    { title: "Victoria Peak", description: "Vue skyline, a placer si la meteo est degagee.", sourceLabel: "Discover Hong Kong", sourceUrl: "https://www.discoverhongkong.com/eng/index.html", coordinates: [22.2759, 114.1455] },
    { title: "Star Ferry et Victoria Harbour", description: "Trajet iconique et promenade Tsim Sha Tsui en soiree.", sourceLabel: "Discover Hong Kong", sourceUrl: "https://www.discoverhongkong.com/eng/index.html", coordinates: [22.2938, 114.1691] },
    { title: "Temple Street ou dim sum", description: "Soiree marche, street food ou adresse dim sum.", sourceLabel: "Discover Hong Kong", sourceUrl: "https://www.discoverhongkong.com/eng/index.html", coordinates: [22.3069, 114.1692] },
  ],
  Shanghai: [
    { title: "The Bund et Huangpu", description: "Promenade classique au bord du fleuve, ideale au coucher du soleil.", sourceLabel: "Expedia Shanghai", sourceUrl: "https://www.expedia.com/Things-To-Do-In-Shanghai.d180026.Travel-Guide-Activities", coordinates: [31.2397, 121.4998] },
    { title: "Former French Concession", description: "Balade plus calme entre cafes, rues arborees et petites boutiques.", sourceLabel: "Conde Nast Traveler", sourceUrl: "https://www.cntraveler.com/stories/2014-12-18/things-to-do-in-shanghai-weekend-guide", coordinates: [31.2152, 121.4581] },
    { title: "Tianzifang ou art district", description: "Option compacte pour shopping, cafes et galeries.", sourceLabel: "Conde Nast Traveler", sourceUrl: "https://www.cntraveler.com/stories/2014-12-18/things-to-do-in-shanghai-weekend-guide", coordinates: [31.2106, 121.4692] },
  ],
  Jakarta: [
    { title: "Monas et Merdeka Square", description: "Point de repere central, facile a combiner avec les monuments voisins.", sourceLabel: "Travel Lush", sourceUrl: "https://travel-lush.com/9-things-to-do-jakarta/", coordinates: [-6.1754, 106.8272] },
    { title: "Kota Tua et Sunda Kelapa", description: "Vieille ville, port historique et photos urbaines.", sourceLabel: "Travel Lush", sourceUrl: "https://travel-lush.com/9-things-to-do-jakarta/", coordinates: [-6.1352, 106.8133] },
    { title: "Street food night tour", description: "Bon format weekend pour voir plusieurs quartiers sans trop planifier.", sourceLabel: "Travel Lush", sourceUrl: "https://travel-lush.com/9-things-to-do-jakarta/", coordinates: [-6.1267, 106.8086] },
  ],
  Kinmen: [
    { title: "Juguang Tower et patrimoine militaire", description: "Introduction rapide a l'histoire particuliere de Kinmen.", sourceLabel: "Kinmen Travel", sourceUrl: "https://kinmen.travel/en/discover/travel-guide", coordinates: [24.4304, 118.3176] },
    { title: "Zhaishan Tunnel", description: "Site militaire souterrain, tres adapte a un court sejour.", sourceLabel: "Taiwan Tourism", sourceUrl: "https://eng.taiwan.net.tw/m1.aspx?sno=0043590", coordinates: [24.4094, 118.3097] },
    { title: "Little Kinmen en ferry", description: "Excursion courte possible grace au trajet d'environ 10 minutes.", sourceLabel: "Kinmen Travel", sourceUrl: "https://kinmen.travel/en/discover/travel-guide", coordinates: [24.4273, 118.2469] },
  ],
  Okinawa: [
    { title: "Kokusai-dori a Naha", description: "Base simple pour shopping, repas et premiere soiree.", sourceLabel: "Visit Okinawa Japan", sourceUrl: "https://visitokinawajapan.com/", coordinates: [26.2147, 127.6841] },
    { title: "Shuri / patrimoine ryukyu", description: "Patrimoine culturel a combiner avec Naha si le weekend est court.", sourceLabel: "Visit Okinawa Japan", sourceUrl: "https://visitokinawajapan.com/", coordinates: [26.217, 127.7193] },
    { title: "Aquarium ou plage", description: "Option journee selon transport: Churaumi Aquarium, Manza Beach ou cote ouest.", sourceLabel: "Expedia Okinawa", sourceUrl: "https://www.expedia.com/Things-To-Do-In-Okinawa-Island.d10805.Travel-Guide-Activities", coordinates: [26.6942, 127.878] },
  ],
  Osaka: [
    { title: "Dotonbori et Minami", description: "Neons, street food et coeur le plus efficace pour une soiree.", sourceLabel: "Japan Travel Osaka", sourceUrl: "https://www.japan.travel/en/destinations/kansai/osaka/", coordinates: [34.6687, 135.501] },
    { title: "Osaka Castle Park", description: "Classique historique et parc facile a integrer dans une demi-journee.", sourceLabel: "Japan Travel Osaka", sourceUrl: "https://www.japan.travel/en/destinations/kansai/osaka/", coordinates: [34.6873, 135.5262] },
    { title: "Tenma ou Ura Namba", description: "Quartiers food pour profiter du cote cuisine d'Osaka.", sourceLabel: "Japan Travel Osaka", sourceUrl: "https://www.japan.travel/en/destinations/kansai/osaka/", coordinates: [34.7047, 135.5123] },
  ],
};

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseBudget(value: string) {
  return Number(value.replace(/[^\d,]/g, "").replace(",", "."));
}

function estimateTotalBudget(seed: WeekendSeed) {
  const values = [seed.flightBudget, seed.lodgingBudget, seed.dailyBudget, seed.activityBudget].map(parseBudget);
  return values.reduce((sum, value) => sum + value, 0);
}

function createWeekendSteps(seed: WeekendSeed): Trip["steps"] {
  const activities = (weekendActivities[seed.city] ?? []).filter(
    (activity): activity is WeekendActivity => Array.isArray(activity.coordinates),
  );
  const citySlug = slugify(seed.city);
  const cityCenterStep: Trip["steps"][number] = {
    id: citySlug,
    label: `${seed.city} centre`,
    shortLabel: seed.city,
    region: seed.country,
    country: seed.country,
    color: travelColors.weekend,
    coordinates: seed.coordinates,
    startDate: seed.startDate,
    endDate: seed.endDate,
    nights: "2 nuits",
    transport: `Vol ou trajet depuis ${seed.departureAirport}. Budget vol indicatif: ${seed.flightBudget}.`,
    highlights: [
      `Logement: ${seed.lodgingBudget}`,
      `Budget / j: ${seed.dailyBudget}`,
      `Activites: ${seed.activityBudget}`,
    ],
    dailyPlan: [
      { date: "Jour 1", summary: `Arrivee depuis ${seed.departureAirport}, installation et premiere balade a ${seed.city}.` },
      { date: "Jour 2", summary: `Journee complete centree sur ${seed.city}: quartiers, activites et repas locaux.` },
      { date: "Jour 3", summary: `Derniere visite courte puis retour depuis ${seed.city}.` },
    ],
    activities,
  };

  const activitySteps: Trip["steps"] = activities.map((activity, index) => ({
    id: `${citySlug}-${slugify(activity.title)}`,
    label: activity.title,
    shortLabel: `Lieu ${index + 1}`,
    region: seed.country,
    country: seed.country,
    color: travelColors.weekendPlace,
    coordinates: activity.coordinates,
    startDate: seed.startDate,
    endDate: seed.endDate,
    nights: "Point a voir",
    transport: `Sur place pendant le weekend a ${seed.city}.`,
    highlights: [activity.description, `Source: ${activity.sourceLabel}`],
    dailyPlan: [{ date: "Weekend", summary: activity.description }],
    activities: [activity],
  }));

  return [cityCenterStep, ...activitySteps];
}

function createWeekendTrip(seed: WeekendSeed): Trip {
  const id = `weekend-${slugify(seed.city)}-2026`;
  const totalBudget = estimateTotalBudget(seed);

  return {
    id,
    folderId: weekendFolderId,
    title: `Weekend a ${seed.city}`,
    description: `Format court centre sur ${seed.city}, depuis ${seed.departureAirport}, base sur la feuille Voyages exportee depuis Google Sheets.`,
    startDate: seed.startDate,
    endDate: seed.endDate,
    status: "draft",
    stats: [
      { value: "3", label: "jours" },
      { value: "2", label: "nuits" },
      { value: `${Math.round(totalBudget)} EUR`, label: "budget indicatif" },
    ],
    steps: createWeekendSteps(seed),
    bookings: [
      {
        id: `${id}-transport`,
        tripId: id,
        category: "Transport",
        label: `Verifier le trajet ${seed.departureAirport} -> ${seed.city}.`,
        priority: "medium",
        status: "todo",
        dueDate: seed.startDate,
        notes: `Budget vol indicatif: ${seed.flightBudget}.`,
      },
      {
        id: `${id}-logement`,
        tripId: id,
        category: "Hebergement",
        label: `Trouver un logement central a ${seed.city}.`,
        priority: "medium",
        status: "todo",
        notes: `Budget logement indicatif: ${seed.lodgingBudget}.`,
      },
    ],
    documents: [
      {
        id: `${id}-source-voyages`,
        title: "Feuille source Voyages",
        type: "reference",
        path: "/docs/Mobilité_inter/Voyages.html",
        tripId: id,
        visibility: "public",
      },
    ],
    notes: seed.notes,
  };
}

const weekendFolderId = "weekends-depuis-taiwan";

export const weekendTripsFolder: TravelFolder = {
  id: weekendFolderId,
  label: "Weekends depuis Taiwan",
  trips: weekendSeeds.map(createWeekendTrip),
};

export const weekendExpenseItems: ExpenseItem[] = weekendSeeds.flatMap((seed) => {
  const tripId = `weekend-${slugify(seed.city)}-2026`;
  return [
    {
      id: `${tripId}-expense-flight`,
      tripId,
      label: `Transport ${seed.departureAirport} -> ${seed.city}`,
      category: "Transport",
      kind: "planned",
      amount: parseBudget(seed.flightBudget),
      currency: "EUR",
      date: seed.startDate,
    },
    {
      id: `${tripId}-expense-lodging`,
      tripId,
      label: `Logement ${seed.city}`,
      category: "Hebergement",
      kind: "planned",
      amount: parseBudget(seed.lodgingBudget),
      currency: "EUR",
      date: seed.startDate,
    },
    {
      id: `${tripId}-expense-daily`,
      tripId,
      label: `Budget quotidien ${seed.city}`,
      category: "Vie sur place",
      kind: "planned",
      amount: parseBudget(seed.dailyBudget),
      currency: "EUR",
      date: seed.startDate,
    },
    {
      id: `${tripId}-expense-activities`,
      tripId,
      label: `Activites ${seed.city}`,
      category: "Activites",
      kind: "planned",
      amount: parseBudget(seed.activityBudget),
      currency: "EUR",
      date: seed.startDate,
    },
  ];
});
