// services/authService.ts
import {
    CognitoIdentityProviderClient,
    InitiateAuthCommand,
    SignUpCommand,
    ConfirmSignUpCommand,
    AdminGetUserCommand,
    AdminDeleteUserCommand,
    AdminUpdateUserAttributesCommand,
    ListUsersCommand
} from "@aws-sdk/client-cognito-identity-provider";

if (!process.env.NEXT_PUBLIC_AWS_REGION ||
    !process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID ||
    !process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID) {
    throw new Error('Missing required AWS configuration. Please check your .env.local file.');
}

export const cognitoClient = new CognitoIdentityProviderClient({
    region: process.env.NEXT_PUBLIC_AWS_REGION,
});

export const signIn = async (username: string, password: string) => {
    const params = {
        AuthFlow: "USER_PASSWORD_AUTH",
        ClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
        AuthParameters: {
            USERNAME: username,
            PASSWORD: password,
        },
    };
    try {
        const command = new InitiateAuthCommand(params);
        const { AuthenticationResult } = await cognitoClient.send(command);
        if (AuthenticationResult) {
            sessionStorage.setItem("idToken", AuthenticationResult.IdToken || "");
            sessionStorage.setItem(
                "accessToken",
                AuthenticationResult.AccessToken || "",
            );
            sessionStorage.setItem(
                "refreshToken",
                AuthenticationResult.RefreshToken || "",
            );
            return AuthenticationResult;
        }
    } catch (error) {
        console.error("Error signing in: ", error);
        throw error;
    }
};

export const signUp = async (email: string, password: string, userType: string) => {
    const params = {
        ClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
        Username: email,
        Password: password,
        UserAttributes: [
            {
                Name: "email",
                Value: email,
            },
            {
                Name: "custom:userType",
                Value: userType,
            },
        ],
    };
    try {
        const command = new SignUpCommand(params);
        const response = await cognitoClient.send(command);
        console.log("Sign up success: ", response);
        return response;
    } catch (error) {
        console.error("Error signing up: ", error);
        throw error;
    }
};

export const confirmSignUp = async (username: string, code: string) => {
    const params = {
        ClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
        Username: username,
        ConfirmationCode: code,
    };
    try {
        const command = new ConfirmSignUpCommand(params);
        await cognitoClient.send(command);
        console.log("User confirmed successfully");
        return true;
    } catch (error) {
        console.error("Error confirming sign up: ", error);
        throw error;
    }
};

export const getUser = async (username: string) => {
    const params = {
        UserPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
        Username: username
    };
    try {
        const command = new AdminGetUserCommand(params);
        const response = await cognitoClient.send(command);
        return response;
    } catch (error) {
        console.error("Error getting user: ", error);
        throw error;
    }
};

export const deleteUser = async (username: string) => {
    const params = {
        UserPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
        Username: username
    };
    try {
        const command = new AdminDeleteUserCommand(params);
        await cognitoClient.send(command);
        return true;
    } catch (error) {
        console.error("Error deleting user: ", error);
        throw error;
    }
};

export const updateUserAttributes = async (username: string, attributes: { Name: string; Value: string }[]) => {
    const params = {
        UserPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
        Username: username,
        UserAttributes: attributes
    };
    try {
        const command = new AdminUpdateUserAttributesCommand(params);
        await cognitoClient.send(command);
        return true;
    } catch (error) {
        console.error("Error updating user attributes: ", error);
        throw error;
    }
};

export const listUsers = async (limit = 10, paginationToken?: string) => {
    const params = {
        UserPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
        Limit: limit,
        ...(paginationToken && { PaginationToken: paginationToken })
    };
    try {
        const command = new ListUsersCommand(params);
        const response = await cognitoClient.send(command);
        return response;
    } catch (error) {
        console.error("Error listing users: ", error);
        throw error;
    }
};