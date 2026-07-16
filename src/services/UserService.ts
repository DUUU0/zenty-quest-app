import * as SecureStore from 'expo-secure-store';
import { apiClient } from './api';

type UserProps = { email: string; password: string };

class UserService {
    async login(dados: UserProps) {
        const { data } = await apiClient.post('/auth/login', dados);
        if (data && data.token) {
            await SecureStore.setItemAsync('token', data.token);
            await SecureStore.setItemAsync('role', data.role);
            return data;
        }
        return null;
    }

    async isAuthenticated(): Promise<boolean> {
        const token = await SecureStore.getItemAsync('token');
        return !!token && token !== 'undefined' && token !== 'null';
    }

    async getRole(): Promise<string | null> {
        return await SecureStore.getItemAsync('role');
    }

    async isAdmin() {
        return (await this.getRole())?.toLowerCase() === 'admin';
    }

    async isTeacher() {
        return (await this.getRole())?.toLowerCase() === 'teacher';
    }

    async isStudent() {
        return (await this.getRole())?.toLowerCase() === 'student';
    }

    async logOut(router: any) {
        await SecureStore.deleteItemAsync('token');
        await SecureStore.deleteItemAsync('role');
        router.replace('/login');
    }
}

export default new UserService();