import { validateTravelFolders } from "../lib/validation";
import { coreTravelFolders } from "./database";
import { weekendTripsFolder } from "./weekendTrips";

export const travelFolders = validateTravelFolders([...coreTravelFolders, weekendTripsFolder]);
