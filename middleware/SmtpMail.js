import { createTransport } from 'nodemailer'
import smtpTransport from 'nodemailer-smtp-transport'




function generateEmailTemplate(template) {
    let emailTemplate

    switch(template.template){
      case "registrationBridgingSirs" :
        emailTemplate =
        `<!DOCTYPE html>
        <html lang="id">
        <head>
          <meta charset="UTF-8" />
          <title>Verifikasi Email</title>
          <style>
            body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
            .container { background: #fff; max-width: 600px; margin: 40px auto; border: 1px solid #ddd; }
            .header { text-align: center; padding: 20px; }
            .header img { max-height: 100px; }
            .content { padding: 20px; line-height: 1.6; color: #333; }
            .content h2 { margin-top: 0; }
            .button {
              display: inline-block;
              background-color: #4CAF50;
              color: white;
              padding: 12px 20px;
              text-align: center;
              text-decoration: none;
              font-size: 1em;
              border-radius: 5px;
              margin-top: 10px;
            }
            .note { font-size: 0.9em; color: #555; margin-top: 20px; }
            .warning { margin-top: 20px; color: #b00; font-weight: bold; }
            .footer { font-size: 0.8em; color: #888; text-align: center; padding: 15px; border-top: 1px solid #eee; }
            a { color: #0066cc; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img align="left"  src="https://keslan.kemkes.go.id/img/LogoKemKesDKL.png" alt="YourApp Logo" />
              <br><br><br><br>
            </div>
            <div class="content">
              <h2>Verifikasi Email</h2>
              <p>Yth. `+ template.namaUser + `,</p>
              <p>
                Terima kasih telah melakukan registrasi integrasi SIRS6 2025 di <strong>https://sirs6.kemkes.go.id/v3/</strong>.  
                Untuk menyelesaikan proses verifikasi pendaftaran integrasi, silakan klik tombol di bawah ini:
              </p>
              <p style="text-align: center;">
                <a style="color:white;" class="button" href="`+ template.link + `" target="_blank">Verifikasi Sekarang</a>
              </p>
              <p class="note">
                Pastikan Anda menyelesaikan proses verifikasi karena tombol ini hanya berlaku 1 jam setelah submit form registrasi pada web  
                <a href="https://sirs6.kemkes.go.id/v3/">https://sirs6.kemkes.go.id/v3/</a>.
              </p>
              <div class="warning">
                Peringatan Keamanan:<br/>
                • Jangan meneruskan email ini kepada siapapun.<br/>
                • Tombol verifikasi hanya berlaku 1 jam setelah submit form registrasi.<br/>
              </div>
              <p class="note">
                Jika Anda tidak melakukan permintaan ini, abaikan email ini atau silakan mengirim email ke  
                di <a href="datinkeslan@kemkes.go.id">datinkeslan@kemkes.go.id</a>.
              </p>
            </div>
            <div class="footer">
              © 2025 Ditjen Kesehatan Lanjutan<br/>
              Ini email otomatis, mohon tidak dibalas.
            </div>
          </div>
        </body>
        </html>
        `
        break
      case "reviewApiRegistApproved" :
        emailTemplate =
        `
        <!DOCTYPE html>
        <html lang="id">
        <head>
          <meta charset="UTF-8" />
          <title>Hasil Review</title>
          <style>
            body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
            .container { background: #fff; max-width: 600px; margin: 40px auto; border: 1px solid #ddd; }
            .header { text-align: center; padding: 20px; }
            .header img { max-height: 100px; }
            .content { padding: 20px; line-height: 1.6; color: #333; }
            .content h2 { margin-top: 0; }
            .button {
              display: inline-block;
              background-color: #4CAF50;
              color: white;
              padding: 12px 20px;
              text-align: center;
              text-decoration: none;
              font-size: 1em;
              border-radius: 5px;
              margin-top: 10px;
            }
            .note { font-size: 0.9em; color: #555; margin-top: 20px; }
            .warning { margin-top: 20px; color: #b00; font-weight: bold; }
            .footer { font-size: 0.8em; color: #888; text-align: center; padding: 15px; border-top: 1px solid #eee; }
            a { color: #0066cc; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img align="left"  src="https://keslan.kemkes.go.id/img/LogoKemKesDKL.png" alt="YourApp Logo" />
              <br><br><br><br>
            </div>
            <div class="content">
              <h3>Hasil Review Registrasi API Integrasi Pelaporan SIRS6</h3>
              <p>Yth. `+ template.namaUser + `,</p>
              <p>
                Terima kasih telah melakukan registrasi integrasi SIRS6v3 di <strong>https://sirs6.kemkes.go.id/v3/</strong>.  
Hasil Review Registrasi oleh Admin SIRS6v3 telah <strong>diterima/disetujui</strong>  berikut kredensial untuk melakukan uji coba integrasi pada server development : </p>
<div style="text-align: center;">
  <div style="display: inline-block; background-color: #20B2AA; padding: 15px; border-radius: 8px;">
    <p style="color: white; font-weight: bold; margin: 1px 0;">API Key : `+ template.api_key + `</p>
    <p style="color: white; font-weight: bold; margin: 1px 0;">API Secret : `+ template.api_secret + `</p>
  </div>
</div>
              </p>
              <p class="note">
                Pastikan Anda melalukan percobaan integrasi pada server development untuk melanjutkan proses pengajuan API Production, jika sudah berhasil melakukan integrasi pada server development silakan melakukan pengajuan API production pada web  
                <a href="https://sirs6.kemkes.go.id/v3/">https://sirs6.kemkes.go.id/v3/</a>. Sertakan juga bukti hasil integrasi sudah berhasil pada saat pengajuan API Production. Berikut link dokumentasi dan juknis penggunaaan API Development 
              </p>
                            <p style="text-align: center;">
                <a style="color:white;" class="button" href="`+ template.link + `" target="_blank">Dokumentasi API</a>
              </p>
              <div class="warning">
                Peringatan Keamanan:<br/>
                • Jangan meneruskan email ini kepada siapapun.<br/>
                • Jangan menyebarkan kredensial API ini kepada siapapun.<br/>
              </div>
  
            </div>
            <div class="footer">
              © 2025 Ditjen Kesehatan Lanjutan<br/>
              Ini email otomatis, mohon tidak dibalas.
            </div>
          </div>
        </body>
        </html>
        `
        break
      case "reviewApiRegistDecline" :
        emailTemplate =
        `<!DOCTYPE html>
        <html lang="id">
        <head>
          <meta charset="UTF-8" />
          <title>Hasil Review</title>
          <style>
            body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
            .container { background: #fff; max-width: 600px; margin: 40px auto; border: 1px solid #ddd; }
            .header { text-align: center; padding: 20px; }
            .header img { max-height: 100px; }
            .content { padding: 20px; line-height: 1.6; color: #333; }
            .content h2 { margin-top: 0; }
            .button {
              display: inline-block;
              background-color: #4CAF50;
              color: white;
              padding: 12px 20px;
              text-align: center;
              text-decoration: none;
              font-size: 1em;
              border-radius: 5px;
              margin-top: 10px;
            }
            .note { font-size: 0.9em; color: #555; margin-top: 20px; }
            .warning { margin-top: 20px; color: #b00; font-weight: bold; }
            .footer { font-size: 0.8em; color: #888; text-align: center; padding: 15px; border-top: 1px solid #eee; }
            a { color: #0066cc; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img align="left"  src="https://keslan.kemkes.go.id/img/LogoKemKesDKL.png" alt="YourApp Logo" />
              <br><br><br><br>
            </div>
            <div class="content">
              <h3>Hasil Review Registrasi API Integrasi Pelaporan SIRS6</h3>
              <p>Yth. `+ template.namaUser + `,</p>
              <p>
                Terima kasih telah melakukan registrasi integrasi SIRS6v3 di <strong>https://sirs6.kemkes.go.id/v3/</strong>.  
Hasil Review Registrasi oleh Admin SIRS6v3 telah <strong>ditolak/tidak disetujui</strong> dengan catatan :</p><p> <strong>`+ template.catatan + `</strong></p>
              </p>
              <p class="note">
                Pastikan Anda menindaklanjuti catatan hasil review sehingga pengajuan registrasi bisa dilanjutkan kembali untuk mendapatkan kredensial API Development Integrasi SIRS6v3 pada web  
                <a href="https://sirs6.kemkes.go.id/v3/">https://sirs6.kemkes.go.id/v3/</a>
              </p>
  
            </div>
            <div class="footer">
              © 2025 Ditjen Kesehatan Lanjutan<br/>
              Ini email otomatis, mohon tidak dibalas.
            </div>
          </div>
        </body>
        </html>
        `
        break
        case "reviewApiProductionRequestApproved" :
          emailTemplate =
          `
          <!DOCTYPE html>
          <html lang="id">
          <head>
            <meta charset="UTF-8" />
            <title>Hasil Review</title>
            <style>
              body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
              .container { background: #fff; max-width: 600px; margin: 40px auto; border: 1px solid #ddd; }
              .header { text-align: center; padding: 20px; }
              .header img { max-height: 100px; }
              .content { padding: 20px; line-height: 1.6; color: #333; }
              .content h2 { margin-top: 0; }
              .button {
                display: inline-block;
                background-color: #4CAF50;
                color: white;
                padding: 12px 20px;
                text-align: center;
                text-decoration: none;
                font-size: 1em;
                border-radius: 5px;
                margin-top: 10px;
              }
              .note { font-size: 0.9em; color: #555; margin-top: 20px; }
              .warning { margin-top: 20px; color: #b00; font-weight: bold; }
              .footer { font-size: 0.8em; color: #888; text-align: center; padding: 15px; border-top: 1px solid #eee; }
              a { color: #0066cc; text-decoration: none; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <img align="left"  src="https://keslan.kemkes.go.id/img/LogoKemKesDKL.png" alt="YourApp Logo" />
                <br><br><br><br>
              </div>
              <div class="content">
                <h3>Hasil Review Registrasi API Integrasi Pelaporan SIRS6</h3>
                <p>Yth. `+ template.namaUser + `,</p>
                <p>
                  Terima kasih telah melakukan request API Production Integrasi SIRS6v3 di <strong>https://sirs6.kemkes.go.id/v3/</strong>.  
  Hasil Review Request API Production oleh Admin SIRS6v3 telah <strong>diterima/disetujui</strong>  berikut kredensial untuk melakukan integrasi pada server production : </p>
  <div style="text-align: center;">
    <div style="display: inline-block; background-color: #20B2AA; padding: 15px; border-radius: 8px;">
      <p style="color: white; font-weight: bold; margin: 1px 0;">API Key : `+ template.api_key + `</p>
      <p style="color: white; font-weight: bold; margin: 1px 0;">API Secret : `+ template.api_secret + `</p>
    </div>
  </div>
                </p>
                <p class="note">
                  Berikut untuk juknis dan dokumentasi API Production Integrasi SIRS 6 :
                </p>
                              <p style="text-align: center;">
                  <a style="color:white;" class="button" href="`+ template.link + `" target="_blank">Dokumentasi API Production</a>
                </p>
                <div class="warning">
                  Peringatan Keamanan:<br/>
                  • Jangan meneruskan email ini kepada siapapun.<br/>
                  • Jangan menyebarkan kredensial API ini kepada siapapun.<br/>
                </div>
    
              </div>
              <div class="footer">
                © 2025 Ditjen Kesehatan Lanjutan<br/>
                Ini email otomatis, mohon tidak dibalas.
              </div>
            </div>
          </body>
          </html>
          `
          break
        case "reviewApiProductionRequestDecline" :
          emailTemplate =
          `<!DOCTYPE html>
          <html lang="id">
          <head>
            <meta charset="UTF-8" />
            <title>Hasil Review</title>
            <style>
              body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
              .container { background: #fff; max-width: 600px; margin: 40px auto; border: 1px solid #ddd; }
              .header { text-align: center; padding: 20px; }
              .header img { max-height: 100px; }
              .content { padding: 20px; line-height: 1.6; color: #333; }
              .content h2 { margin-top: 0; }
              .button {
                display: inline-block;
                background-color: #4CAF50;
                color: white;
                padding: 12px 20px;
                text-align: center;
                text-decoration: none;
                font-size: 1em;
                border-radius: 5px;
                margin-top: 10px;
              }
              .note { font-size: 0.9em; color: #555; margin-top: 20px; }
              .warning { margin-top: 20px; color: #b00; font-weight: bold; }
              .footer { font-size: 0.8em; color: #888; text-align: center; padding: 15px; border-top: 1px solid #eee; }
              a { color: #0066cc; text-decoration: none; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <img align="left"  src="https://keslan.kemkes.go.id/img/LogoKemKesDKL.png" alt="YourApp Logo" />
                <br><br><br><br>
              </div>
              <div class="content">
                <h3>Hasil Review Request API Production Integrasi Pelaporan SIRS6</h3>
                <p>Yth. `+ template.namaUser + `,</p>
                <p>
                  Terima kasih telah melakukan Request API Production integrasi SIRS6v3 di <strong>https://sirs6.kemkes.go.id/v3/</strong>.  
  Hasil Review Request API Production oleh Admin SIRS6v3 telah <strong>ditolak/tidak disetujui</strong> dengan catatan :</p><p> <strong>`+ template.catatan + `</strong></p>
                </p>
                <p class="note">
                  Pastikan Anda menindaklanjuti catatan hasil review sehingga pengajuan API Production bisa dilanjutkan kembali untuk mendapatkan kredensial API Production Integrasi SIRS6v3 pada web  
                  <a href="https://sirs6.kemkes.go.id/v3/">https://sirs6.kemkes.go.id/v3/</a>
                </p>
    
              </div>
              <div class="footer">
                © 2025 Ditjen Kesehatan Lanjutan<br/>
                Ini email otomatis, mohon tidak dibalas.
              </div>
            </div>
          </body>
          </html>
          `
          break
          
      default:
      emailTemplate = "HAPPY BIRTHDAY";
    }
//     if (template.template === "registrationBridgingSirs") {
//         emailTemplate =
// `<!DOCTYPE html>
// <html lang="id">
// <head>
//   <meta charset="UTF-8" />
//   <title>Verifikasi Email</title>
//   <style>
//     body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
//     .container { background: #fff; max-width: 600px; margin: 40px auto; border: 1px solid #ddd; }
//     .header { text-align: center; padding: 20px; }
//     .header img { max-height: 100px; }
//     .content { padding: 20px; line-height: 1.6; color: #333; }
//     .content h2 { margin-top: 0; }
//     .button {
//       display: inline-block;
//       background-color: #4CAF50;
//       color: white;
//       padding: 12px 20px;
//       text-align: center;
//       text-decoration: none;
//       font-size: 1em;
//       border-radius: 5px;
//       margin-top: 10px;
//     }
//     .note { font-size: 0.9em; color: #555; margin-top: 20px; }
//     .warning { margin-top: 20px; color: #b00; font-weight: bold; }
//     .footer { font-size: 0.8em; color: #888; text-align: center; padding: 15px; border-top: 1px solid #eee; }
//     a { color: #0066cc; text-decoration: none; }
//   </style>
// </head>
// <body>
//   <div class="container">
//     <div class="header">
//       <img align="left"  src="https://keslan.kemkes.go.id/img/LogoKemKesDKL.png" alt="YourApp Logo" />
//       <br><br><br><br>
//     </div>
//     <div class="content">
//       <h2>Verifikasi Email</h2>
//       <p>Yth. `+ template.namaUser + `,</p>
//       <p>
//         Terima kasih telah mendaftarkan user integrasi SIRS6 2025 di <strong>https://sirs6.kemkes.go.id/v3/</strong>.  
//         Untuk menyelesaikan proses verifikasi pendaftaran integrasi, silakan klik tombol di bawah ini:
//       </p>
//       <p style="text-align: center;">
//         <a style="color:white;" class="button" href="`+ template.link + `" target="_blank">Verifikasi Sekarang</a>
//       </p>
//       <p class="note">
//         Pastikan Anda menyelesaikan proses verifikasi karena tombol ini hanya berlaku 1 jam setelah submit form registrasi pada web  
//         <a href="https://sirs6.kemkes.go.id/v3/">https://sirs6.kemkes.go.id/v3/</a>.
//       </p>
//       <div class="warning">
//         Peringatan Keamanan:<br/>
//         • Jangan meneruskan email ini kepada siapapun.<br/>
//         • Tombol verifikasi hanya berlaku 1 jam setelah submit form registrasi.<br/>
//       </div>
//       <p class="note">
//         Jika Anda tidak melakukan permintaan ini, abaikan email ini atau silakan mengirim email ke  
//         di <a href="datinkeslan@kemkes.go.id">datinkeslan@kemkes.go.id</a>.
//       </p>
//     </div>
//     <div class="footer">
//       © 2025 Ditjen Kesehatan Lanjutan<br/>
//       Ini email otomatis, mohon tidak dibalas.
//     </div>
//   </div>
// </body>
// </html>
// `
//     }
    return emailTemplate;
}

export const sendEmail = (data) => {
    // console.log("test ", data)
    const messages = generateEmailTemplate(data)
    return new Promise((resolve, reject) => {
        const transporter = createTransport(smtpTransport({
            host: "mail.kemkes.go.id",
            port: 465,
            secure: true,
            auth: {
                user: 'infoyankes@kemkes.go.id',
                pass: 'n3nceY@D'
            }
        }));

        const mailOptions = {
            from: 'infoyankes@kemkes.go.id',
            to: data.email,
            subject: data.subject,
            html: messages
        };
        
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log("cek ", error)
                reject("send email error");
            } else {
                resolve(info);
            }
        });
    });
};



// export const sendEmail = (data, callback) => {

//     var transporter = createTransport(smtpTransport({
//         host: "mail.kemkes.go.id",
//         port: 465,
//         secure: true,
//         auth: {
//             user: 'infoyankes@kemkes.go.id',
//             pass: 'n3nceY@D'
//         }
//     }))

//     var mailOptions = {
//         from: 'infoyankes@kemkes.go.id',
//         to: data.email,
//         subject: data.subject,
//         html: data.emailMessages
//     };

//     transporter.sendMail(mailOptions, function (error, info) {
//         if (error) {
//             otpNumber = null
//             callback(error, null)
//         } else {
//             callback(null, info)
//         }
//     });
// }