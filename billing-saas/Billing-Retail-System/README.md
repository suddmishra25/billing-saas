# Billing Software

A full-stack billing software application built with Spring Boot (Java) backend and React frontend.

## Project Structure

- **Backend**: Spring Boot application with JPA, Security, JWT, MySQL, AWS S3, and Razorpay integration
- **Frontend**: React application with Vite build tool

## Prerequisites

Before running this project, make sure you have the following installed:

1. **Java 21** - [Download JDK 21](https://adoptium.net/)
2. **Node.js** (v16 or higher) - [Download Node.js](https://nodejs.org/)
3. **MySQL** (v8.0 or higher) - [Download MySQL](https://dev.mysql.com/downloads/)
4. **Maven** (optional - project includes Maven wrapper)

## Setup Instructions

### 1. Database Setup

1. Install and start MySQL server
2. Create a database (or the application will create it automatically)
3. Update database credentials in `src/main/resources/application.properties`

### 2. Configuration

Update the following configuration files:

#### Backend Configuration (`src/main/resources/application.properties`)

```properties
# Update these values with your actual credentials
spring.datasource.username=your_mysql_username
spring.datasource.password=your_mysql_password

# JWT Configuration
jwt.secret=your_secure_jwt_secret_key

# AWS S3 Configuration (if using file uploads)
aws.access.key.id=your_aws_access_key
aws.secret.access.key=your_aws_secret_key
aws.s3.region=your_aws_region
aws.s3.bucket.name=your_bucket_name

# Razorpay Configuration (if using payments)
razorpay.key.id=your_razorpay_key_id
razorpay.key.secret=your_razorpay_key_secret
```

### 3. Backend Setup

1. Navigate to the project root directory
2. Run the Spring Boot application:

```bash
# Using Maven wrapper (recommended)
./mvnw spring-boot:run

# Or using Maven if installed globally
mvn spring-boot:run
```

The backend will start on `http://localhost:8080`

### 4. Frontend Setup

1. Navigate to the client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will start on `http://localhost:5173` (or another available port)

## Running the Application

### Development Mode

1. **Start Backend**: Run `./mvnw spring-boot:run` from the project root
2. **Start Frontend**: Run `npm run dev` from the `client` directory
3. **Access Application**: Open `http://localhost:5173` in your browser

### Production Build

1. **Build Frontend**:
```bash
cd client
npm run build
```

2. **Build Backend**:
```bash
./mvnw clean package
```

3. **Run Production Backend**:
```bash
java -jar target/Bilingsoftware-0.0.1-SNAPSHOT.jar
```

## Features

Based on the codebase, this application includes:

- **User Authentication** - Login/logout with JWT
- **User Management** - Create, read, update, delete users
- **Category Management** - Manage product categories
- **Item Management** - Manage products/items
- **Order Management** - Create and manage orders
- **Payment Integration** - Razorpay payment gateway
- **File Upload** - AWS S3 integration for file storage
- **Dashboard** - Analytics and reporting
- **Receipt Generation** - Print receipts for orders

## API Endpoints

The backend provides REST APIs at `http://localhost:8080/api/v1.0/`:

- `/login` - User authentication
- `/users` - User management
- `/categories` - Category management
- `/items` - Item management
- `/orders` - Order management
- `/payments` - Payment processing
- `/dashboard` - Dashboard data

## Troubleshooting

### Common Issues

1. **Database Connection Error**:
   - Ensure MySQL is running
   - Check database credentials in `application.properties`
   - Verify database exists or set `createDatabaseIfNotExist=true`

2. **Port Already in Use**:
   - Change server port in `application.properties`
   - Kill processes using the port

3. **Frontend Build Errors**:
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   - Check Node.js version compatibility

4. **CORS Issues**:
   - The backend should handle CORS for development
   - Check SecurityConfig.java for CORS configuration

## Development

### Backend Development
- Main application: `src/main/java/in/sudhanshu/Billingsoftware/BilingsoftwareApplication.java`
- Controllers: `src/main/java/in/sudhanshu/Billingsoftware/controller/`
- Services: `src/main/java/in/sudhanshu/Billingsoftware/service/`
- Entities: `src/main/java/in/sudhanshu/Billingsoftware/entity/`

### Frontend Development
- Main app: `client/src/App.jsx`
- Components: `client/src/components/`
- Pages: `client/src/pages/`
- Services: `client/src/Services/`

## License

This project is licensed under the MIT License. 

## Created By
Yash Nayan
