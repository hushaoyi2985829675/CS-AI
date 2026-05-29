import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Linking, Platform } from 'react-native';
import { Button, TextInput, Text, Card, IconButton, Divider } from 'react-native-paper';
import { useAppContext } from '../context/AppContext';
import { getSteamDirectLoginUrl, setToken } from '../api';

const AuthScreen: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [steamLoading, setSteamLoading] = useState(false);

  const { login, register, isLoading, fetchData } = useAppContext();

  useEffect(() => {
    const handleSteamCallback = async () => {
      try {
        let url: string | null = null;
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          url = window.location.href;
        } else {
          url = await Linking.getInitialURL();
        }
        if (!url) return;
        const parsed = new URL(url);
        const steamLogin = parsed.searchParams.get('steam_login');
        const steamBind = parsed.searchParams.get('steam_bind');
        const token = parsed.searchParams.get('token');
        if ((steamLogin === 'success' || steamBind === 'success') && token) {
          await setToken(token);
          await fetchData();
          if (Platform.OS === 'web' && typeof window !== 'undefined') {
            window.history.replaceState({}, '', parsed.pathname);
          }
        }
      } catch (e) {
        console.error('Steam 回调处理失败:', e);
      }
    };
    handleSteamCallback();
  }, []);

  const handleLogin = async () => {
    setError('');
    if (!username || !password) {
      setError('请填写用户名和密码');
      return;
    }
    try {
      await login(username, password);
    } catch (e: any) {
      setError(e?.message || '登录失败，请检查用户名和密码');
    }
  };

  const handleSteamLogin = async () => {
    setError('');
    setSteamLoading(true);
    try {
      const url = await getSteamDirectLoginUrl();
      if (Platform.OS === 'web') {
        window.location.href = url;
      } else {
        await Linking.openURL(url);
      }
    } catch (e: any) {
      setError(e?.message || 'Steam 登录失败，请重试');
    } finally {
      setSteamLoading(false);
    }
  };

  const handleRegister = async () => {
    setError('');
    if (!username || !password || !confirmPassword) {
      setError('请填写所有必填字段');
      return;
    }
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }
    try {
      await register({ username, password });
    } catch (e: any) {
      setError(e?.message || '注册失败，请重试');
    }
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <IconButton icon="crosshairs" size={48} style={styles.icon} />
            <Text style={styles.title}>CS2 库存分析</Text>
            <Text style={styles.subtitle}>
              {isLogin ? '欢迎回来' : '创建你的账号'}
            </Text>
          </View>

          <View style={styles.form}>
            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TextInput
              label="用户名"
              value={username}
              onChangeText={setUsername}
              mode="outlined"
              style={styles.input}
              disabled={isLoading}
            />

            <TextInput
              label="密码"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              secureTextEntry
              style={styles.input}
              disabled={isLoading}
            />

            {!isLogin && (
              <TextInput
                label="确认密码"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                mode="outlined"
                secureTextEntry
                style={styles.input}
                disabled={isLoading}
              />
            )}

            <Button
              mode="contained"
              onPress={isLogin ? handleLogin : handleRegister}
              style={styles.button}
              loading={isLoading}
            >
              {isLogin ? '登录' : '注册'}
            </Button>

            <Button
              mode="text"
              onPress={() => { setIsLogin(!isLogin); setError(''); }}
              style={styles.switchBtn}
              disabled={isLoading}
            >
              {isLogin ? '还没有账号？注册' : '已有账号？登录'}
            </Button>

            <Divider style={styles.divider} />

            <Button
              mode="outlined"
              onPress={handleSteamLogin}
              style={styles.steamButton}
              icon="steam"
              loading={steamLoading}
              disabled={isLoading || steamLoading}
              textColor="#1b2838"
            >
              使用 Steam 登录
            </Button>
          </View>
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  card: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  icon: {
    backgroundColor: '#1a73e8',
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  form: {
    gap: 15,
  },
  error: {
    color: '#e53935',
    fontSize: 14,
    textAlign: 'center',
    backgroundColor: '#ffebee',
    padding: 10,
    borderRadius: 8,
  },
  input: {
    backgroundColor: 'white',
  },
  button: {
    marginTop: 10,
  },
  switchBtn: {
    marginTop: 5,
  },
  divider: {
    marginVertical: 10,
  },
  steamButton: {
    borderColor: '#1b2838',
  },
});

export default AuthScreen;
