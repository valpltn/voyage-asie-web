import { useMediaQuery } from "../lib/useMediaQuery";
import { DesktopTripSwitcher } from "./DesktopTripSwitcher";
import { MobileTripSwitcher } from "./MobileTripSwitcher";
import type { TripSwitcherProps } from "./TripSwitcher.shared";

export function TripSwitcher(props: TripSwitcherProps) {
  const isMobile = useMediaQuery("(max-width: 700px)");
  return isMobile ? <MobileTripSwitcher {...props} /> : <DesktopTripSwitcher {...props} />;
}
