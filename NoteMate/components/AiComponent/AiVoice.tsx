import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  useAudioRecorder,
  useAudioRecorderState,
  AudioModule,
  setAudioModeAsync,
  RecordingPresets,
  useAudioPlayer,
} from 'expo-audio';
import * as FileSystem from 'expo-file-system';
import { API_URL } from '../../constants/api';


interface AiVoiceProps {
  note: string;
  setNote: React.Dispatch<React.SetStateAction<string>>;
}

export const AiVoice: React.FC<AiVoiceProps> = ({ note, setNote}) => {
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);

  const [recordedUri, setRecordedUri] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [transcript, setTranscript] = useState('');

  // Player setup: chỉ tạo player nếu đã có recordedUri
  const player = useAudioPlayer(recordedUri ? { uri: recordedUri } : null);

  useEffect(() => {
    (async () => {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        Alert.alert('Permission to access microphone was denied');
        return;
      }

      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
      });
    })();
  }, []);

  const startRecording = async () => {
    await audioRecorder.prepareToRecordAsync();
    await audioRecorder.record();
  };

  const stopRecording = async () => {
    await audioRecorder.stop();
    if (audioRecorder.uri) {
      setRecordedUri(audioRecorder.uri);
    }
  };

  const sendAudioToServer = async () => {
    if (!recordedUri) return;

    try {
      setIsSending(true);
      const fileInfo = await FileSystem.getInfoAsync(recordedUri);

      const formData = new FormData();
      formData.append('file', {
        uri: fileInfo.uri,
        name: 'voice.wav',
        type: 'audio/wav',
      } as any);

      const response = await fetch(`${API_URL}/AI/voice-to-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const result = await response.json();
      console.log("Result /voice-to-text: ", result);
      console.log("Result /voice-to-text: ", result.text);
      
      setTranscript(result.text || 'Không nhận được văn bản.');
      setNote(result.text)
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.AIbutton}
        onPress={recorderState.isRecording ? stopRecording : startRecording}
      >
        <Image source={require('../../assets/images/i.png')} style={styles.AIicon} />
        <Text style={styles.AIlabel}>
          {recorderState.isRecording ? 'ĐANG GHI...' : 'GHI ÂM'}
        </Text>
      </TouchableOpacity>

      {recordedUri !== '' && (
        <>
          <TouchableOpacity style={styles.sendButton} onPress={sendAudioToServer}>
            <Text style={styles.sendLabel}>GỬI ĐẾN AI</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.playButton}
            onPress={() => {
              player.seekTo(0);
              player.play();
            }}
          >
            <Text style={styles.playLabel}>PHÁT LẠI</Text>
          </TouchableOpacity>
        </>
      )}

      {isSending && <ActivityIndicator size="small" color="#FF8A4C" style={{ marginTop: 12 }} />}

      {/* {transcript !== '' && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultLabel}>Kết quả:</Text>
          <Text style={styles.resultText}>{transcript}</Text>
        </View>
      )} */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: 'center',
  },
  playButton: {
    marginTop: 10,
    backgroundColor: '#2196F3',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  playLabel: {
    color: '#fff',
    fontWeight: 'bold',
  },
  AIbutton: {
    backgroundColor: '#FF8A4C',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
  },
  AIicon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
    tintColor: '#fff',
    marginBottom: 4,
  },
  AIlabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
  },
  sendButton: {
    marginTop: 16,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  sendLabel: {
    color: '#fff',
    fontWeight: 'bold',
  },
  resultContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#EFEFEF',
    borderRadius: 8,
    width: '100%',
  },
  resultLabel: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  resultText: {
    color: '#333',
  },
});
