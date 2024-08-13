import sendEmail from "./utils/sendEmail.js"; // Adjust the path as necessary

const testEmail = async () => {
  try {
    await sendEmail(
      "kalimdurrani22@gmail.com",
      "Test Subject",
      "Test email content"
    );
    console.log("Email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

testEmail();
