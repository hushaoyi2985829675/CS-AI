import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, TextInput, Text, Card, IconButton } from 'react-native-paper';
import { useAppContext } from '../context/AppContext';

const AuthScreen: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const { login, register, isLoading } = useAppContext();

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

  const handleRegister = async () => {
    setError('');
    if (!username || !email || !password || !confirmPassword) {
      setError('请填写所有必填字段');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('请输入有效的邮箱地址');
      return;
    }
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }
    try {
      await register({ username, email, password });
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

            {!isLogin && (
              <TextInput
                label="邮箱"
                value={email}
                onChangeText={setEmail}
                mode="outlined"
                style={styles.input}
                keyboardType="email-address"
                disabled={isLoading}
              />
            )}

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
});

export default AuthScreen;
