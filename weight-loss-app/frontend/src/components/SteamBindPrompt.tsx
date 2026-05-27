import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text } from 'react-native-paper';

interface SteamBindPromptProps {
  onBind: () => void;
}

const SteamBindPrompt: React.FC<SteamBindPromptProps> = ({ onBind }) => (
  <View style={styles.container}>
    <Text style={styles.icon}>🎮</Text>
    <Text style={styles.title}>请先绑定 Steam 账号</Text>
    <Text style={styles.subtitle}>绑定后即可使用完整功能</Text>
    <Button mode="contained" onPress={onBind} style={styles.button}>
      登录 Steam 绑定
    </Button>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f5f5f5',
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  button: {
    minWidth: 160,
  },
});

export default SteamBindPrompt;
