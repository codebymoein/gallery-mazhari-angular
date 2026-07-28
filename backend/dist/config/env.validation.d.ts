declare class EnvironmentVariables {
    PORT: string;
    DB_TYPE: 'postgres' | 'sqlite';
    DB_HOST: string;
    DB_PORT: string;
    DB_USERNAME: string;
    DB_PASSWORD: string;
    DB_NAME: string;
    JWT_SECRET: string;
    JWT_EXPIRES_IN: string;
    ADMIN_SETUP_KEY: string;
    NODE_ENV: 'development' | 'production' | 'test';
}
export default EnvironmentVariables;
