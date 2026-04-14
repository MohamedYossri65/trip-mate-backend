export function verifiedHTML(): string {
  return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>Email Verified</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          background-color: #f8f9fa;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          overflow: hidden;
        }

        .content {
          text-align: center;
          max-width: 600px;
          padding: 20px;
          animation: fadeIn 1.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        h1 {
          font-size: 38px;
          font-weight: 700;
          color: #562DDD;
          margin-bottom: 15px;
        }

        p {
          font-size: 18px;
          color: #333;
          margin-bottom: 10px;
        }
      </style>
    </head>
    <body>
      <div class="confetti"></div>
      <div class="content">
        <h1>Email Verified</h1>
        <p>Welcome aboard! </p>
        <p>Your email has been successfully verified.</p>
        <p>We're thrilled to have you with us.</p>
      </div>
    </body>
    </html>`;
}

export function alreadyVerifiedHTML(): string {
  return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>Email Verified</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          background-color: #f8f9fa;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          overflow: hidden;
        }

        .content {
          text-align: center;
          max-width: 600px;
          padding: 20px;
          animation: fadeIn 1.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        h1 {
          font-size: 38px;
          font-weight: 700;
          color: #120a2bff;
          margin-bottom: 15px;
        }
      </style>
    </head>
    <body>
      <div class="confetti"></div>
      <div class="content">
        <h1>Your Email Has Been Already Verified</h1>
      </div>
    </body>
    </html>`;
}
