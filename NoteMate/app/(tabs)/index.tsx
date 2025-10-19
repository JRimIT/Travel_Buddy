import React, { useEffect, useState, useCallback } from "react";
import NoteComponent from "../../components/NoteComponent/note_page";
import { useRouter } from "expo-router";
import { Button } from "react-native";



const Home = () => {
  const router = useRouter();

  return (<>
    {/* <Button
      title="Lên kế hoạch du lịch"
      onPress={() => router.push('/TravelPlanner')}
    /> */}
    <NoteComponent/>
  </>
    
  );
};

export default Home;  
