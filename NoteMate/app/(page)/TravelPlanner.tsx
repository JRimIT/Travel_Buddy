import React, { useState } from "react";
import { View } from "react-native";
import PlaceSearch from "../../components/PlaceSearch";
import TransportCompare from "../../components/TransportCompare";
import PlacesAround from "../../components/PlacesAround";
import createHomeStyles from "../../assets/styles/home.styles";
import { useTheme } from "../../contexts/ThemeContext";
import GetCurrentLocation from "../../components/GetCurrentLocation";



const TravelPlanner = () => {
    const { colors } = useTheme();
  
  const styles = createHomeStyles(colors);
  const [dest, setDest] = useState(null);
    const [start, setStart] = useState(null);

  console.log("Start:", start, " || Dest:", dest);
  
  return (
    <View style={styles.page}>
        <GetCurrentLocation onGetLocation={setStart} />
        <PlaceSearch onSelect={item => setDest({lat: item.geometry.coordinates[1], lng: item.geometry.coordinates[0]})} />
            {dest && (
                <>
                    {/* <TransportCompare start={start} end={dest} /> */}
                    <PlacesAround lat={dest.lat} lng={dest.lng} />
                </>
            )}
    </View>

  );
};
export default TravelPlanner;
