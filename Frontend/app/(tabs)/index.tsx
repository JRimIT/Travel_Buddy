import React, { useEffect, useState, useCallback } from "react";
import NoteComponent from "../../components/NoteComponent/note_page";
import { useRouter } from "expo-router";
import { Button } from "react-native";
import TravelSchedulePublicScreen from "../../components/ScheduleComponent/TravelSchedulePublic";

const Home = () => {
  const router = useRouter();

  return (
    <>
      {/* <Button
      title="Lên kế hoạch du lịch"
      onPress={() => router.push('/TravelPlanner')}
    /> */}
      {/* <NoteComponent/> */}
      <TravelSchedulePublicScreen />
    </>
  );
};

export default Home;
