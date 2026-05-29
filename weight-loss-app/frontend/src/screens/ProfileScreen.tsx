import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { Text, Card, Button, IconButton, Divider, List, Modal, Portal } from 'react-native-paper';
import { useAppContext } from '../context/AppContext';

const ProfileScreen: React.FC = () => {
  const { user, logout } = useAppContext();
  const [settingsVisible, setSettingsVisible] = useState(false);

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('确定要退出登录吗？');
      if (confirmed) {
        setSettingsVisible(false);
        logout();
      }
    } else {
      setSettingsVisible(false);
      logout();
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.username?.charAt(0)?.toUpperCase() || '?'}</Text>
          </View>
          <Text style={styles.username}>{user?.username || '未登录'}</Text>
          {user?.steamId && (
            <Text style={styles.steamId}>Steam ID: {user.steamId}</Text>
          )}
          <IconButton
            icon="cog"
            size={24}
            onPress={() => setSettingsVisible(true)}
            style={styles.settingsBtn}
          />
        </View>

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>账号信息</Text>
            <Divider style={styles.divider} />
            <List.Item
              title="用户名"
              description={user?.username || '-'}
              left={(props) => <List.Icon {...props} icon="account" />}
            />
            <List.Item
              title="Steam 绑定"
              description={user?.steamId ? '已绑定' : '未绑定'}
              left={(props) => <List.Icon {...props} icon="steam" />}
            />
          </Card.Content>
        </Card>
      </ScrollView>

      <Portal>
        <Modal
          visible={settingsVisible}
          onDismiss={() => setSettingsVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <Text style={styles.modalTitle}>设置</Text>
          <Divider style={styles.divider} />
          <List.Item
            title="退出登录"
            description="退出当前账号"
            left={(props) => <List.Icon {...props} icon="logout" color="#e74c3c" />}
            onPress={handleLogout}
            titleStyle={{ color: '#e74c3c' }}
          />
          <Button
            mode="text"
            onPress={() => setSettingsVisible(false)}
            style={styles.closeBtn}
          >
            关闭
          </Button>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1a73e8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  steamId: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  settingsBtn: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  divider: {
    marginBottom: 12,
  },
  modal: {
    backgroundColor: '#fff',
    margin: 24,
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  closeBtn: {
    marginTop: 16,
  },
});

export default ProfileScreen;
