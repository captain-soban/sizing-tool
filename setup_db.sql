-- Create database and user for the sizing tool
CREATE DATABASE planning_poker;
CREATE USER sizingtool WITH ENCRYPTED PASSWORD 'sizing';
GRANT ALL PRIVILEGES ON DATABASE planning_poker TO sizingtool;

-- Connect to the new database and grant schema permissions
\c planning_poker;
GRANT ALL ON SCHEMA public TO sizingtool;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO sizingtool;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO sizingtool;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO sizingtool;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO sizingtool;