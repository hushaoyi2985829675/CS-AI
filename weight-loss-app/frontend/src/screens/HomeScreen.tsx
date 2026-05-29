import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useAppContext } from '../context/AppContext';
import SteamBindPrompt from '../components/SteamBindPrompt';
import * as api from '../api';

const HomeScreen: React.FC = () => {
  const { user } = useAppContext();

  if (!user?.steamId) {
    return (
      <SteamBindPrompt
        onBind={async () => {
          try {
            const url = await api.getSteamLoginUrl();
            window.location.href = url;
          } catch (e: any) {
            alert(e?.message || '获取Steam登录地址失败');
          }
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
