export const swaggerDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Civic Issue Platform Backend API',
    version: '1.0.0',
    description:
      'Backend REST API for Civic Issue Platform where citizens report civic issues, NGOs claim and fix them, and administrators oversee workflows.',
  },
  servers: [
    {
      url: '/api/v1',
      description: 'API v1 Base URL',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      ApiResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: { type: 'object' },
          meta: {
            type: 'object',
            properties: {
              page: { type: 'integer' },
              size: { type: 'integer' },
              total: { type: 'integer' },
            },
          },
        },
      },
      ApiError: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'VALIDATION_FAILED' },
              message: { type: 'string' },
              details: { type: 'array', items: { type: 'object' } },
            },
          },
        },
      },
      OtpRequest: {
        type: 'object',
        required: ['phone'],
        properties: {
          phone: { type: 'string', example: '+919000000001' },
        },
      },
      OtpVerify: {
        type: 'object',
        required: ['phone', 'code'],
        properties: {
          phone: { type: 'string', example: '+919000000001' },
          code: { type: 'string', example: '123456' },
        },
      },
      PasswordLogin: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', example: 'admin@civic.gov.in' },
          password: { type: 'string', example: 'Admin@123456' },
        },
      },
      RefreshTokenRequest: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: { type: 'string' },
        },
      },
      ChangePasswordRequest: {
        type: 'object',
        required: ['oldPassword', 'newPassword'],
        properties: {
          oldPassword: { type: 'string' },
          newPassword: { type: 'string' },
        },
      },
    },
  },
  paths: {
    '/auth/otp/request': {
      post: {
        summary: 'Request OTP for citizen phone login',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/OtpRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'OTP sent successfully',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } },
          },
          '403': {
            description: 'Phone not whitelisted (Dummy mode)',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } },
          },
        },
      },
    },
    '/auth/otp/verify': {
      post: {
        summary: 'Verify OTP and retrieve JWT access and refresh tokens',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/OtpVerify' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Tokens issued successfully',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } },
          },
          '400': {
            description: 'Invalid or expired OTP',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } },
          },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Email and password login for NGO and Admin accounts',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PasswordLogin' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Login successful, tokens returned',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } },
          },
          '401': {
            description: 'Invalid credentials',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } },
          },
        },
      },
    },
    '/auth/refresh': {
      post: {
        summary: 'Exchange refresh token for a new 15-minute access token',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RefreshTokenRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'New access token issued',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } },
          },
        },
      },
    },
    '/public/visit': {
      post: {
        summary: 'Record anonymous daily visitor count (deduplicated by cookie)',
        tags: ['Public'],
        responses: {
          '200': {
            description: 'Visit recorded',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } },
          },
        },
      },
    },
    '/categories': {
      get: {
        summary: 'List all active civic issue categories',
        tags: ['Public'],
        responses: {
          '200': {
            description: 'List of categories',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } },
          },
        },
      },
    },
    '/leaderboard': {
      get: {
        summary: 'Public NGO leaderboard ranked by verified outcomes',
        tags: ['Public'],
        parameters: [
          {
            name: 'period',
            in: 'query',
            schema: { type: 'string', enum: ['ALL', 'MONTH'], default: 'ALL' },
          },
        ],
        responses: {
          '200': {
            description: 'NGO leaderboard list',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } },
          },
        },
      },
    },
    '/ngos/{id}/profile': {
      get: {
        summary: 'Public profile of an NGO including stats and recent work',
        tags: ['Public'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        responses: {
          '200': {
            description: 'NGO profile details',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } },
          },
        },
      },
    },
    '/me': {
      get: {
        summary: 'Get current logged-in user profile, role, and reward points balance',
        tags: ['User'],
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'User profile with reward points balance',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } },
          },
          '401': {
            description: 'Unauthenticated',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } },
          },
        },
      },
      put: {
        summary: 'Update current user profile (name, bio, avatarUrl)',
        tags: ['User'],
        security: [{ BearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  bio: { type: 'string' },
                  avatarUrl: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Updated user profile',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } },
          },
        },
      },
    },
  },
};
