export const verificationEmail = (username = 'User', otp: string): string => {
  if (!otp) {
    console.error('❌ Error: Confirmation URL is missing!');
    return '<p>Error: Confirmation URL is missing!</p>';
  }

  return `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Email Confirmation</title>
  </head>
  <body>
    <div>
      <div>
        <h2>Confirm Your Email Address</h2>
      </div>
      <div>
        <p>Dear <strong>${username}</strong>,</p>
        <p>Thank you for signing up!</p>
        <p>To complete your registration, use the code below to verify your account:</p>
        <p>
          <strong>${otp}</strong>
        </p>
        <p>If you did not request this code or did not sign up for this account</p>
        <p>Please ignore this message.</p>
      </div>
  </body>
  </html>`;
};

// TODO: Change later
export const passwordResetEmail = (verificationCode: string): string => {
  const otp = `${verificationCode}`;
  return `<html>
<body>
  <h3>Password Reset</h3>
  <div>
    <p>We've received your request to be able to reset your password.</p>
    <p>Please take this opt: ${otp}   to reset your password.</p>
    <p>This otp will expire in 10 min.</p>
    <p>If you did not request to reset your password, you should be able to ignore this email.</p>
  </div>
  <div>
    <p>Thank you from the ACKWAD team</p>
  </div>
</body>
</html>
`;
};
