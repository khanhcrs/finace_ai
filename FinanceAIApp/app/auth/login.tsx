import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, KeyboardAvoidingView, Platform,
    ScrollView, ActivityIndicator, Alert
} from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import axios from 'axios';
import { API_BASE_URL } from '../../src/api/config';
import { useSettings } from '../../src/context/SettingsContext';

export default function LoginScreen() {
    const { login } = useAuth();
    const { darkMode } = useSettings();
    const [isLogin, setIsLogin] = useState(true);
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!email || !password || (!isLogin && !fullName)) {
            Alert.alert("Lỗi", "Vui lòng điền đầy đủ thông tin");
            return;
        }

        setLoading(true);
        try {
            if (isLogin) {
                const response = await axios.post(`${API_BASE_URL}/users/login`, {
                    email,
                    password
                });
                const userData = response.data;

                await login({
                    id: userData.id,
                    fullName: userData.fullName,
                    email: userData.email
                });
            } else {
                await axios.post(`${API_BASE_URL}/users/register`, {
                    fullName,
                    email,
                    passwordHash: password
                });
                Alert.alert("Thành công", "Đăng ký thành công! Hãy đăng nhập.");
                setIsLogin(true);
                setPassword('');
            }
        } catch (err: any) {
            console.error(err);
            const msg = err.response?.data || "Có lỗi xảy ra. Vui lòng thử lại!";
            Alert.alert("Lỗi", typeof msg === 'string' ? msg : "Sai email hoặc mật khẩu");
        } finally {
            setLoading(false);
        }
    };

    const textColor = darkMode ? '#fff' : '#000';
    const bgColor = darkMode ? '#121212' : '#F9FAFB';
    const cardColor = darkMode ? '#1E1E1E' : '#fff';

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: bgColor }]}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={[styles.card, { backgroundColor: cardColor }]}>
                    <View style={styles.logoContainer}>
                        <View style={styles.logo}>
                            <Text style={styles.logoText}>F</Text>
                        </View>
                        <Text style={[styles.title, { color: textColor }]}>
                            Finance<Text style={{ opacity: 0.5 }}>AI</Text>
                        </Text>
                        <Text style={styles.subtitle}>
                            {isLogin ? "Đăng nhập để quản lý tài chính" : "Bắt đầu hành trình quản lý tài chính"}
                        </Text>
                    </View>

                    <View style={styles.form}>
                        {!isLogin && (
                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: textColor }]}>Họ và tên</Text>
                                <TextInput
                                    style={[styles.input, { color: textColor, backgroundColor: darkMode ? '#333' : '#F3F4F6' }]}
                                    placeholder="VD: Khánh Trần"
                                    placeholderTextColor="#999"
                                    value={fullName}
                                    onChangeText={setFullName}
                                />
                            </View>
                        )}

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: textColor }]}>Email</Text>
                            <TextInput
                                style={[styles.input, { color: textColor, backgroundColor: darkMode ? '#333' : '#F3F4F6' }]}
                                placeholder="khanhtran@example.com"
                                placeholderTextColor="#999"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={email}
                                onChangeText={setEmail}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: textColor }]}>Mật khẩu</Text>
                            <TextInput
                                style={[styles.input, { color: textColor, backgroundColor: darkMode ? '#333' : '#F3F4F6' }]}
                                placeholder="••••••••"
                                placeholderTextColor="#999"
                                secureTextEntry
                                value={password}
                                onChangeText={setPassword}
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: darkMode ? '#fff' : '#000' }]}
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color={darkMode ? '#000' : '#fff'} />
                            ) : (
                                <Text style={[styles.buttonText, { color: darkMode ? '#000' : '#fff' }]}>
                                    {isLogin ? "Đăng nhập" : "Đăng ký"}
                                </Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.toggleButton}
                            onPress={() => setIsLogin(!isLogin)}
                        >
                            <Text style={styles.toggleText}>
                                {isLogin ? "Chưa có tài khoản? Đăng ký" : "Đã có tài khoản? Đăng nhập"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    card: {
        borderRadius: 32,
        padding: 30,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    logo: {
        width: 60,
        height: 60,
        backgroundColor: '#000',
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    logoText: {
        color: '#fff',
        fontSize: 30,
        fontWeight: '900',
    },
    title: {
        fontSize: 24,
        fontWeight: '900',
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 5,
        textAlign: 'center',
    },
    form: {
        gap: 15,
    },
    inputGroup: {
        marginBottom: 10,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 8,
    },
    input: {
        borderRadius: 12,
        padding: 15,
        fontSize: 16,
    },
    button: {
        backgroundColor: '#000',
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    toggleButton: {
        marginTop: 15,
        alignItems: 'center',
    },
    toggleText: {
        color: '#666',
        fontSize: 14,
        fontWeight: '600',
    }
});
