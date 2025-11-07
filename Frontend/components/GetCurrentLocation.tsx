import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';

const GetCurrentLocation = ({ onGetLocation }) => {
  const [isGetting, setIsGetting] = useState(false);
  const getLocation = async () => {
    setIsGetting(true);
    // Xin quyền sử dụng location
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      alert('Ứng dụng cần quyền truy cập vị trí để sử dụng tính năng này!');
      setIsGetting(false);
      return;
    }
    let location = await Location.getCurrentPositionAsync({});
    const coords = {
      lat: location.coords.latitude,
      lng: location.coords.longitude
    };
    setIsGetting(false);
    
    if (onGetLocation) onGetLocation(coords); // Trả về cho parent
  };

  useEffect(() => {
    getLocation(); // Lấy vị trí khi vào component
  }, []);

  return null; 
};

export default GetCurrentLocation;
