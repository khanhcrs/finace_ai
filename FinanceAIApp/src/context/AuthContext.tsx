import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type User = {
    id: number;
    fullName: string;
    email: string;
};

type AuthContextType = {
    user: User | null;
    isLoading: boolean;
    login: (userData: User) => Promise<void>;
    logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadUser = async () => {
            try {
                const userId = await AsyncStorage.getItem('finance_user_id');
                const fullName = await AsyncStorage.getItem('finance_user_name');
                const email = await AsyncStorage.getItem('finance_user_email');

                if (userId && fullName && email) {
                    setUser({
                        id: parseInt(userId),
                        fullName,
                        email
                    });
                }
            } catch (e) {
                console.error('Failed to load user', e);
            } finally {
                setIsLoading(false);
            }
        };
        loadUser();
    }, []);

    const login = async (userData: User) => {
        try {
            await AsyncStorage.setItem('finance_user_id', String(userData.id));
            await AsyncStorage.setItem('finance_user_name', userData.fullName);
            await AsyncStorage.setItem('finance_user_email', userData.email);
            setUser(userData);
        } catch (e) {
            console.error('Failed to save user', e);
        }
    };

    const logout = async () => {
        try {
            await AsyncStorage.removeItem('finance_user_id');
            await AsyncStorage.removeItem('finance_user_name');
            await AsyncStorage.removeItem('finance_user_email');
            setUser(null);
        } catch (e) {
            console.error('Failed to logout', e);
        }
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
