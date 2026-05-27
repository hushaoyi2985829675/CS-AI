import React from 'react';
import { View, StyleSheet, Linking } from 'react-native';
import { useAppContext } from '../context/AppContext';
import SteamBindPrompt from '../components/SteamBindPrompt';
import { getToken } from '../api';

const HomeScreen: React.FC = () => {
  const { user } = useAppContext();

  if (!user?.steamId) {
    return (
      <SteamBindPrompt
        onBind={async () => {
          const t = await getToken();
          if (t) Linking.openURL(`http://localhost:8000/api/auth/steam/login?token=${t}`);
        }}
      />
    );
  }

  return <View style={styles.container} />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});

export default HomeScreen;
