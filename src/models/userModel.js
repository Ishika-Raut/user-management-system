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
    isEmailOtpVerified: {
        type: Boolean,
        default: false
    },
    emailOtpExpiration: {
        type: Date,
        default: null
    },
    passwordOtp: {
        type: String,
        default: null
    },
    isPasswordOtpVerified: {
        type: Boolean,
        default: false
    },
    passwordOtpExpiration: {
        type: Date,
        default: null
    },
    refreshToken: {
            type: String
    }
}, 
{
    timestamps: true
});

const User = mongoose.model("User", userSchema);
export default User;