let db = require("../models");
const { firebaseAdmin, app } = require("../firebase/index.model");
const admin = require("firebase-admin");
const { errorResponse } = require("../helper/error");
const { sendWelcomeEmail, sendPasswordResetCustomEmail } = require("../utils/email")
const crypto = require('crypto');

const generateAccessToken = () => crypto.randomBytes(32).toString("hex"); // 64 characters
const generateRefreshToken = () => crypto.randomBytes(64).toString("hex"); // 128 characters

const {
    getAuth,
    signInWithEmailAndPassword,
} = require("firebase/auth");

// ********** SIGN UP VIA EMAIL **********
exports.signup = async (req, res) => {
    try {
        let body = req.body;
        let user = await admin.auth(firebaseAdmin).createUser({
            email: body.email,
            password: body.password,
            displayName: body.firstName + " " + body.lastName,
            emailVerified: false,
        });
        if (user) {
            await admin
                .auth(firebaseAdmin)
                .setCustomUserClaims(user.uid, { role: "user" });

            req.body.loginId = user.uid
            let data = await db.USER.create(req.body);

            if (data) {
                await sendWelcomeEmail(body.email, body.firstName);
                res.status(200).send({
                    success: true,
                    message: "User has been created",
                    data: data,
                });
            } else {
                res.status(400).send({
                    success: false,
                    message: body.role + " creation failed",
                });
            }
        }
    } catch (error) {
        console.log(error);
        errorResponse(res, "Internal Server Error", 500, error);
    }
};

// ********** SOCAIL LOGIN **********
exports.socialLogin = async (req, res) => {
    try {
        let findUser = await db.USER.findOne({
            where: { loginId: req.body.loginId }
        });
        if (findUser) {
            res.send({
                success: true,
                data: findUser,
            });
        } else {
            await admin
                .auth(firebaseAdmin)
                .setCustomUserClaims(req.body.loginId, { role: "User" });
            let data = await db.USER.create(req.body);
            if (data) {
                res.send({
                    success: true,
                    data: data,
                });
            }
        }
    } catch (error) {
        console.log(error);
        errorResponse(res, "Internal Server Error", 500, error);
    }
};

// ********** LOGIN USER **********
exports.login = async (req, res) => {
    try {
        const { email, password, platform, deviceInfo } = req.body;

        // 1. Firebase Authentication
        let userCredential;
        try {
            userCredential = await signInWithEmailAndPassword(getAuth(app), email, password);
        } catch (firebaseError) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        const firebaseId = userCredential?._tokenResponse?.localId;
        if (!firebaseId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        // 2. Check user existence
        const user = await db.USER.findOne({ where: { loginId: firebaseId } });
        if (!user) {
            return res.status(404).json({ success: false, message: "No user found" });
        }

        // 3. Generate tokens
        const accessToken = generateAccessToken();
        const refreshToken = generateRefreshToken();
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour
        const refreshTokenExpiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

        // 4. Store session
        await db.USER_SESSION.create({
            userId: user.uid,
            accessToken,
            refreshToken,
            expiresAt,
            refreshTokenExpiry,
            platform,
            deviceInfo,
            ipAddress: req.headers["x-forwarded-for"] || req.ip,
        });

        // 5. Return full user object
        return res.status(200).json({
            success: true,
            accessToken,
            refreshToken,
            expiresAt,
            user,
        });
    } catch (error) {
        console.log(error);
        errorResponse(res, "Internal Server Error", 500, error);
    }
};

// ********** PASSWORD RESET **********
// exports.resetPassword = async (req, res) => {
//     try {
//         let data = await
//             db.USER.findOne({
//                 where: {
//                     email: req.body.email,
//                 },
//             });
//         if (data) {
//             console;
//             if (data) {
//                 const actionCodeSettings = {
//                     url: "https://creditport-f8810.firebaseapp.com",
//                 };
//                 sendPasswordResetEmail(
//                     getAuth(app),
//                     req.body.email,
//                     actionCodeSettings
//                 )
//                     .then((response) => {
//                         res.send({
//                             success: true,
//                             message: "Email Sent. Please check your inbox or spam folder",
//                         });
//                     })
//                     .catch((error) =>
//                         errorResponse(res, "Internal Server Error", 500, error)
//                     );
//             } else {
//                 res.status(404).send({
//                     success: false,
//                     message: "User not found...!",
//                 });
//             }
//         } else {
//             res.status(404).send({
//                 success: false,
//                 message: "User not found...!",
//             });
//         }
//     } catch (error) {
//         errorResponse(res, "Internal Server Error", 500, error);
//     }
// };
exports.resetPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).send({
                success: false,
                message: "Email is required.",
            });
        }

        const user = await db.USER.findOne({ where: { email } });

        if (!user) {
            return res.status(404).send({
                success: false,
                message: "User not found.",
            });
        }

        // const actionCodeSettings = {
        //     url: "https://creditport-f8810.firebaseapp.com", // 🔒 Customize this URL as needed
        // };
        // const resetLink = await getAuth(app).generatePasswordResetLink(email, actionCodeSettings);


        // 🔑 Generate custom password reset link
        const resetLink = await admin.auth().generatePasswordResetLink(email);

        // Send branded email notification
        await sendPasswordResetCustomEmail(email, user?.firstName || "User", resetLink);

        return res.send({
            success: true,
            message: "Password reset link sent. Please check your inbox or spam folder.",
        });
    } catch (error) {
        console.error(error);
        errorResponse(res, "Internal Server Error", 500, error);
    }
};

// ********** UPDATE PROFILE **********
exports.updateProfile = async (req, res) => {
    try {
        if (req.body.password) {
            let user = await db.USER.findOne({
                where: {
                    uid: req.body.uid,
                    password: req.body.oldPassword,
                },
            });
            if (user) {
                let data = await admin
                    .auth(firebaseAdmin)
                    .updateUser(user._tokenResponse.localId, {
                        password: req.body.password,
                    });
                if (data) {
                    let update = await db.USER.update(req.body, {
                        where: {
                            uid: req.body.uid,
                        },
                    });
                    if (update == 1) {
                        res.send({
                            success: true,
                            message: "Passwordd Updated Successfully",
                        });
                    } else {
                        res.status(400).send({
                            success: false,
                            message: "Update failed",
                        });
                    }
                } else {
                    res.status(400).send({
                        success: false,
                        message: "Update failed",
                    });
                }
            } else {
                res.status(400).send({
                    success: false,
                    message: "Please enter your correct password to continue...",
                });
            }
        } else {
            let update = await db.USER.update(req.body, {
                where: {
                    uid: req.body.uid,
                },
            });
            if (update == 1) {

                let updatedUser = await db.USER.findOne({
                    where: { uid: req.body.uid },
                });

                res.send({
                    success: true,
                    message: "User Profile Updated Successfully",
                    data: updatedUser
                });
            } else {
                res.status(400).send({
                    success: false,
                    message: "Update failed",
                });
            }
        }
    } catch (error) {
        console.log(error);
        errorResponse(res, "Internal Server Error", 500, error);
    }
};

// ********** LOGOUT USER **********
exports.logout = async (req, res) => {
    const sessionId = req.session.id;

    await db.USER_SESSION.update(
        { isActive: false, loggedOutAt: new Date() },
        { where: { id: sessionId } }
    );

    res.json({ success: true, message: "Logged out successfully" });
};

// ********** CREATE USER BANK **********
exports.createUserBankDetails = async (req, res) => {
    try {
        const { userId, bankId, accountTitle, iban } = req.body;

        // Validate required fields
        if (!userId || !bankId || !accountTitle || !iban) {
            return res.status(400).send({
                success: false,
                message: "All fields (userId, bankId, accountTitle, iban) are required.",
            });
        }

        // Create new bank detail
        let data = await db.USERBANKDETAILS.create({
            userId,
            bankId,
            accountTitle: accountTitle.trim(),
            iban: iban.trim(),
        });

        res.send({
            success: true,
            message: "Bank details created successfully.",
            data
        });

    } catch (error) {
        res.status(500).send({
            success: false,
            message: "Error creating bank details.",
            error: error.message,
        });
    }
};

// ********** UPDATE USER BANK **********
exports.updateUserBankDetails = async (req, res) => {
    const { id } = req.params;
    const { bankId, accountTitle, iban } = req.body;

    try {
        const bankDetail = await db.USERBANKDETAILS.findByPk(id);

        if (!bankDetail) {
            return res.status(404).send({
                success: false,
                message: "Bank detail not found.",
            });
        }

        await bankDetail.update({
            bankId: bankId || bankDetail.bankId,
            accountTitle: accountTitle?.trim() || bankDetail.accountTitle,
            iban: iban?.trim() || bankDetail.iban,
        });

        res.send({
            success: true,
            message: "Bank details updated successfully.",
            data: bankDetail,
        });

    } catch (error) {
        res.status(500).send({
            success: false,
            message: "Failed to update bank details.",
            error: error.message,
        });
    }
};

// ********** USER BANK DETAILS **********
exports.getUserBankDetails = async (req, res) => {
    try {
        const { uid } = req.query;
        const data = await db.USERBANKDETAILS.findAll({
            where: { userId: uid },
            include: [
                {
                    model: db.BANK,
                    attributes: ['id', 'name', 'shortCode'],
                },
            ],
        });

        if (!data) {
            return res.status(404).send({
                success: false,
                message: "No bank details found for this user.",
            });
        }

        res.send({ success: true, data });
    } catch (error) {
        res.status(500).send({
            success: false,
            message: "Error retrieving bank details",
            error: error.message,
        });
    }
};

// ********** DELETE USER BANK DETAILS **********
exports.deleteUserBankDetails = async (req, res) => {
    try {
        const { id } = req.params;

        const bankDetail = await db.USERBANKDETAILS.findByPk(id);
        if (!bankDetail) {
            return res.status(404).send({ success: false, message: "Bank detail not found." });
        }

        await bankDetail.destroy(); // 👈 Soft delete

        res.send({ success: true, message: "Bank detail soft deleted successfully." });
    } catch (error) {
        res.status(500).send({
            success: false,
            message: "Failed to delete bank detail.",
            error: error.message
        });
    }
};
