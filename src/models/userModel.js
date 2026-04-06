import mongoose from "mongoose";

const userSchema = mongoose.Schema({

    name: {
        type: String,
        required: true
    }, 
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    emailOtp: {
        type: String,
        default: null
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    emailOtpExpiration: {
        type: Date,
        default: null
    },
    otpAttempts: {
        type: Number,
        default: 0
    },
    passwordResetToken: {
    type: String,
    default: null
    },
    passwordResetTokenExpiration: {
        type: Date,
        default: null
    },
    //refresh token is stored one per user --> single device.
    refreshToken: {
            type: String
    }
    /*
     // store refresh tokens per device
    refreshTokens: [
        {
            token: String,
            deviceId: String,
            createdAt: { type: Date, default: Date.now }
        }
    ]
    */
}, 
{
    timestamps: true
});

const User = mongoose.model("User", userSchema);
export default User;