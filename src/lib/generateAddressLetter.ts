import fs from 'fs';
import path from 'path';
import { createReport } from 'docx-templates';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { promisify } from 'util';
import { exec } from 'child_process';
import sharp from 'sharp';

const execAsync = promisify(exec);

interface AddressLetterData {
  ticketnumber: string;
  requestor_firstname: string;
  requestor_lastname: string;
  approvedaddress: string;
  apporterinfo: string;
  noticemessage?: string;
  requestors_signature?: string;
  signature_date: string;
}

/**
 * Generates an address letter PDF from the Word template
 * @param data The data to fill in the template
 * @returns The path to the generated PDF file
 */
export async function generateAddressLetter(data: AddressLetterData): Promise<string> {
  try {
    // Paths for template and output files
    const templatePath = path.join(process.cwd(), 'public', 'templates', 'template.docx');
    const outputDir = path.join(process.cwd(), 'public', 'generated');
    const timestamp = Date.now();
    const docxOutputPath = path.join(outputDir, `address_letter_${timestamp}.docx`);
    const pdfOutputPath = path.join(outputDir, `address_letter_${timestamp}.pdf`);
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Read the template
    const template = fs.readFileSync(templatePath);
    
    // Create a report using docx-templates
    const buffer = await createReport({
      template,
      data: {
        ticketnumber: data.ticketnumber,
        requestor_firstname: data.requestor_firstname,
        requestor_lastname: data.requestor_lastname,
        approvedaddress: data.approvedaddress,
        apporterinfo: data.apporterinfo,
        noticemessage: data.noticemessage || '',
        requestors_signature: data.requestors_signature || '',
        signature_date: data.signature_date,
      },
    });
    
    // Write the generated docx file
    fs.writeFileSync(docxOutputPath, buffer);
    
    // Convert DOCX to PDF using LibreOffice (if available)
    try {
      // Try using LibreOffice for conversion (better quality)
      await execAsync(`soffice --headless --convert-to pdf --outdir "${outputDir}" "${docxOutputPath}"`);
    } catch (error) {
      console.error('LibreOffice conversion failed, falling back to basic PDF conversion:', error);
      
      // Fallback to a more detailed PDF conversion that matches the template exactly
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([850, 1100]); // Letter size
      const { width, height } = page.getSize();
      
      // Left column with logo
      try {
        // Check multiple possible locations for the logo
        let logoPath = path.join(process.cwd(), 'public', 'assets', 'images', '911Logo.gif');
        if (!fs.existsSync(logoPath)) {
          logoPath = path.join(process.cwd(), 'public', '911Logo.gif');
        }
        
        if (fs.existsSync(logoPath)) {
          console.log('Found logo at:', logoPath);
          
          try {
            // Convert GIF to PNG using sharp
            const pngBuffer = await sharp(logoPath)
              .toFormat('png')
              .toBuffer();
            
            console.log('Successfully converted GIF to PNG');
            
            // Now use the PNG buffer with pdf-lib
            const logoImage = await pdfDoc.embedPng(pngBuffer);
            
            // Scale the logo to match the template exactly
            const logoDims = logoImage.scale(0.5);
            
            // Draw the logo in the left column - position to match template exactly
            page.drawImage(logoImage, {
              x: 120,
              y: height - 140,
              width: logoDims.width,
              height: logoDims.height,
            });
            
            console.log('Successfully embedded logo in PDF');
          } catch (conversionError) {
            console.error('Error converting or embedding logo:', conversionError);
          }
        } else {
          console.error('Logo file not found at expected locations');
        }
      } catch (error) {
        console.error('Error embedding logo image:', error);
      }
      
      // Header text - left aligned like in the second image - proper blue color
      page.drawText('Rio Grande Valley Emergency Communication District', {
        x: 300,
        y: height - 50,
        size: 14,
        color: rgb(0, 0, 1), // Bright blue color
        font: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
      });
      
      // Board members aligned with header - bright blue and bold
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      page.drawText(`Mayor Gilbert Gonzales Raymondville${'-'.repeat(50)}President`, {
        x: 300,
        y: height - 70,
        size: 8,
        color: rgb(0, 0, 1), // Bright blue color
        font: boldFont,
      });
      
      page.drawText(`Mayor Pro-Tem Joaquin "J.J." Zamora McAllen${'-'.repeat(40)}Vice President`, {
        x: 300,
        y: height - 85,
        size: 8,
        color: rgb(0, 0, 1), // Bright blue color
        font: boldFont,
      });
      
      page.drawText(`Judge Aurelio "Keter" Guerra, Willacy County${'-'.repeat(40)}Secretary`, {
        x: 300,
        y: height - 100,
        size: 8,
        color: rgb(0, 0, 1), // Bright blue color
        font: boldFont,
      });
      
      page.drawText(`Mayor Ramiro Garza Jr, Edinburg${'-'.repeat(50)}Treasurer`, {
        x: 300,
        y: height - 115,
        size: 8,
        color: rgb(0, 0, 1), // Bright blue color
        font: boldFont,
      });
      
      // Left column text - bright blue and bold
      page.drawText('RGV9-1-1', {
        x: 85,
        y: height - 250,
        size: 10,
        color: rgb(0, 0, 1), // Bright blue color
        font: boldFont,
      });
      
      page.drawText('BOARD OF MANAGERS', {
        x: 51,
        y: height - 265,
        size: 10,
        color: rgb(0, 0, 1), // Bright blue color
        font: boldFont,
      });
      
      // Board members in left column
      let leftColY = height - 270;
      const leftColX = 51;
      // Board members in left column - blue color
      page.drawText('Arturo Galvan Jr.', {
        x: 51,
        y: height - 290,
        size: 8,
        color: rgb(0, 0, 1), // Bright blue color
        font: boldFont,
      });
      
      page.drawText('Mayor Pro-Tem Alton', {
        x: 51,
        y: height - 305,
        size: 8,
        color: rgb(0, 0, 1), // Bright blue color
        font: boldFont,
      });
      
      page.drawText('Alonzo "Al" Perez Jr.', {
        x: 51,
        y: height - 320,
        size: 8,
        color: rgb(0, 0, 1), // Bright blue color
        font: boldFont,
      });
      
      page.drawText('Mayor, Elsa', {
        x: 51,
        y: height - 335,
        size: 8,
        color: rgb(0, 0, 1), // Bright blue color
        font: boldFont,
      });
      
      page.drawText('Yvette Cabrera', {
        x: 51,
        y: height - 350,
        size: 8,
        color: rgb(0, 0, 1), // Bright blue color
        font: boldFont,
      });
      
      page.drawText('Mayor, Cameron', {
        x: 51,
        y: height - 365,
        size: 8,
        color: rgb(0, 0, 1), // Bright blue color
        font: boldFont,
      });
      
      page.drawText('Oscar D. Montoya', {
        x: 51,
        y: height - 380,
        size: 8,
        color: rgb(0, 0, 1), // Bright blue color
        font: boldFont,
      });
      
      page.drawText('Mayor, Mercedes', {
        x: 51,
        y: height - 395,
        size: 8,
        color: rgb(0, 0, 1), // Bright blue color
        font: boldFont,
      });
      
      page.drawText('Ramiro Loya', {
        x: 51,
        y: height - 410,
        size: 8,
        color: rgb(0, 0, 1), // Bright blue color
        font: boldFont,
      });
      
      page.drawText('Mayor, Penitas', {
        x: 51,
        y: height - 425,
        size: 8,
        color: rgb(0, 0, 1), // Bright blue color
        font: boldFont,
      });
      
      page.drawText('Alma D. Salinas', {
        x: 51,
        y: height - 440,
        size: 8,
        color: rgb(0, 0, 1), // Bright blue color
        font: boldFont,
      });
      
      page.drawText('Mayor, Sullivan City', {
        x: 51,
        y: height - 455,
        size: 8,
        color: rgb(0, 0, 1), // Bright blue color
        font: boldFont,
      });
      
      page.drawText('Adrian Gonzalez', {
        x: 51,
        y: height - 470,
        size: 8,
        color: rgb(0, 0, 1), // Bright blue color
        font: boldFont,
      });
      
      page.drawText('Mayor, Weslaco', {
        x: 51,
        y: height - 485,
        size: 8,
        color: rgb(0, 0, 1), // Bright blue color
        font: boldFont,
      });
      
      page.drawText('Sheriff J. E. "Eddie Guerra"', {
        x: 51,
        y: height - 500,
        size: 8,
        color: rgb(0, 0, 1), // Bright blue color
        font: boldFont,
      });
      
      page.drawText('Hidalgo County', {
        x: 51,
        y: height - 515,
        size: 8,
        color: rgb(0, 0, 1), // Bright blue color
        font: boldFont,
      });
      
      page.drawText('STAFF', {
        x: 51,
        y: height - 530,
        size: 8,
        color: rgb(0, 0, 1), // Bright blue color
        font: boldFont,
      });
      
      page.drawText('EXECUTIVE DIRECTOR', {
        x: 51,
        y: height - 545,
        size: 8,
        color: rgb(0, 0, 1), // Bright blue color
        font: boldFont,
      });
      
      page.drawText('Manuel "Manny" Cruz', {
        x: 51,
        y: height - 560,
        size: 8,
        color: rgb(0, 0, 1), // Bright blue color
        font: boldFont,
      });
      
      // Center title - truly centered with Arial font
      const titleText = '9-1-1 PHYSICAL ADDRESS NOTIFICATION';
      const titleWidth = titleText.length * 7; // Approximate width
      page.drawText(titleText, {
        x: width / 2 - titleWidth / 2,
        y: height - 180,
        size: 12,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      
      // Ticket number - centered with Arial font and bold
      const ticketText = `Ticket#: ${data.ticketnumber}`;
      const ticketWidth = ticketText.length * 6; // Approximate width
      page.drawText(ticketText, {
        x: width / 2 - ticketWidth / 2,
        y: height - 210,
        size: 12,
        font: boldFont,
      });
      
      // Name and reference number - left aligned with proper spacing - Arial font
      page.drawText('NAME', {
        x: 330,
        y: height - 240,
        size: 10,
        font: boldFont,
      });
      
      page.drawText(`: ${data.requestor_firstname} ${data.requestor_lastname}`, {
        x: 365,
        y: height - 240,
        size: 10,
      });
      
      page.drawText('REF #', {
        x: 330,
        y: height - 265,
        size: 10,
        font: boldFont,
      });
      
      page.drawText(`: ${data.apporterinfo}`, {
        x: 365,
        y: height - 265,
        size: 10,
      });

      // Physical address - left aligned with proper spacing - Arial font
      page.drawText('Based on the PID or Legal Description provided, we have established your ', {
        x: 330,
        y: height - 300,
        size: 10,
      });
      
      page.drawText('9-1-1 PHYSICAL ADDRESS', {
        x: 330 + 'Based on the PID or Legal Description provided, we have established your '.length * 5,
        y: height - 300,
        size: 10,
        font: boldFont,
      });
      
      page.drawText(' as:', {
        x: 330 + 'Based on the PID or Legal Description provided, we have established your 9-1-1 PHYSICAL ADDRESS'.length * 5,
        y: height - 300,
        size: 10,
      });
      
      // Center the approved address like the yellow highlighted text - Arial font
      const addressText = `${data.approvedaddress}`;
      const addressWidth = addressText.length * 6; // Approximate width
      page.drawText(addressText, {
        x: width / 2 - addressWidth / 2,
        y: height - 325,
        size: 12,
        color: rgb(0, 0, 0),
        font: boldFont, // Make it bold
      });
      
      // Add disclaimer section - Arial font
      page.drawText('DISCLAIMER:', {
        x: 330,
        y: height - 350,
        size: 10,
        color: rgb(1, 0, 0), // Red color
        font: boldFont,
      });
      
      page.drawText(`1.  Please keep in mind that your 9-1-1 Physical Address does not necessarily need to be`, {
        x: 300,
        y: height - 360,
        size: 9,
      });
      
      page.drawText(`the same as your Mailing Address. For this reason, please confirm your Mailing Address`, {
        x: 320,
        y: height - 375,
        size: 9,
      });
      
      page.drawText(`with your local Post Office.`, {
        x: 320,
        y: height - 390,
        size: 9,
      });
      
      page.drawText(`2.  Most important, please be advised that this 9-1-1 Physical Address is what we will use in`, {
        x: 300,
        y: height - 410,
        size: 9,
      });
      
      page.drawText(`our 9-1-1 system in case of any emergency, and this is the information that will be displayed to`, {
        x: 320,
        y: height - 425,
        size: 9,
      });
      
      page.drawText(`our Emergency Responders.`, {
        x: 320,
        y: height - 440,
        size: 9,
      });
      
      page.drawText(`3.  Please Help Us, Help You! Please display the assigned 9-1-1 Physical Address so that`, {
        x: 300,
        y: height - 460,
        size: 9,
      });
      
      page.drawText(`it is visible from the street. This is recommended so that our emergency responders can easily`, {
        x: 320,
        y: height - 475,
        size: 9,
      });
      
      page.drawText(`identify your location.`, {
        x: 320,
        y: height - 490,
        size: 9,
      });
      
      if (data.noticemessage) {
        page.drawText(`4.  ${data.noticemessage}`, {
          x: 300,
          y: height - 510,
          size: 9,
        });
      }
      
      // Contact information
      page.drawText(`If you have any questions, please contact us at (956) 682-3481 ext. 174.`, {
        x: 300,
        y: height - 540,
        size: 9,
      });
      
      // Signature section with two columns
      page.drawText(`Sincerely,`, {
        x: 350,
        y: height - 580,
        size: 9,
      });
      
      // LEFT SIDE: Director's signature
      try {
        const directorSignaturePath = path.join(process.cwd(), 'public', 'assets', 'images', 'MannysSignature.jpg');
        if (fs.existsSync(directorSignaturePath)) {
          const directorSignatureBytes = fs.readFileSync(directorSignaturePath);
          // Use embedJpg for JPG format
          const directorSignatureImage = await pdfDoc.embedJpg(directorSignatureBytes);
          
          // Scale the signature to match template
          const directorSignatureDims = directorSignatureImage.scale(0.2);
          
          // Draw the signature on the LEFT side
          page.drawImage(directorSignatureImage, {
            x: 350,
            y: height - 620,
            width: directorSignatureDims.width,
            height: directorSignatureDims.height,
          });
        }
      } catch (error) {
        console.error('Error embedding director signature image:', error);
        // Continue even if signature embedding fails
      }
      
      // Director info on LEFT side
      page.drawText(`Manuel "Manny" Cruz`, {
        x: 350,
        y: height - 670,
        size: 9,
      });
      
      page.drawText(`LRGVDC, Executive Director`, {
        x: 350,
        y: height - 685,
        size: 9,
      });
      
      // RIGHT SIDE: Recipient signature section
      page.drawText(`Recipient's signature`, {
        x: 600,
        y: height - 580,
        size: 9,
      });
      
      // Try to embed the signature image if available
      if (data.requestors_signature) {
        try {
          // Get the absolute path to the signature image
          const signatureImagePath = path.join(process.cwd(), 'public', data.requestors_signature);
          
          if (fs.existsSync(signatureImagePath)) {
            // Read the signature image
            const signatureImageBytes = fs.readFileSync(signatureImagePath);
            
            // Embed the image in the PDF
            const signatureImage = await pdfDoc.embedPng(signatureImageBytes);
            const signatureDims = signatureImage.scale(0.2); // Scale down the signature
            
            // Draw the signature image on the RIGHT side
            page.drawImage(signatureImage, {
              x: 600,
              y: height - 620,
              width: signatureDims.width,
              height: signatureDims.height,
            });
          }
        } catch (error) {
          console.error('Error embedding signature image:', error);
          // Continue even if signature embedding fails
        }
      }
      
      // Date on RIGHT side
      page.drawText(`${data.signature_date}`, {
        x: 600,
        y: height - 650,
        size: 9,
      });
      
      page.drawText(`Date`, {
        x: 600,
        y: height - 665,
        size: 9,
      });
      
      // Recipient name on RIGHT side
      page.drawText(`${data.requestor_firstname} ${data.requestor_lastname}`, {
        x: 600,
        y: height - 685,
        size: 9,
      });
      
      page.drawText(`Recipient's printed name`, {
        x: 600,
        y: height - 700,
        size: 9,
      });
      
      // Add footer - centered
      const footerText1 = `RGV9-1-1 DISTRICT OFFICE: 1912 Joe Stephens Ave, Weslaco, TX, 78596 TEL:(956) 682-3481 Ext. 174`;
      const footerWidth1 = footerText1.length * 4; // Approximate width
      page.drawText(footerText1, {
        x: width / 2 - footerWidth1 / 2,
        y: 100,
        size: 8,
      });
      
      const footerText2 = `ADMINISTRATIVE AGENT: LRGVDC MAIN OFFICE * 301 W. Railroad ST * Weslaco, TX * 78596 * TEL: (956) 682-3481`;
      const footerWidth2 = footerText2.length * 4; // Approximate width
      page.drawText(footerText2, {
        x: width / 2 - footerWidth2 / 2,
        y: 80,
        size: 8,
      });
      
      const footerText3 = `TTY FOR HEARING IMPAIRED: 1-800-735-2989 WEBSITE: www.rgv911.org`;
      const footerWidth3 = footerText3.length * 4; // Approximate width
      page.drawText(footerText3, {
        x: width / 2 - footerWidth3 / 2,
        y: 60,
        size: 8,
      });
      
      // Save the PDF
      const pdfBytes = await pdfDoc.save();
      fs.writeFileSync(pdfOutputPath, pdfBytes);
    }
    
    // Return the path to the generated PDF
    return `/generated/address_letter_${timestamp}.pdf`;
  } catch (error) {
    console.error('Error generating address letter:', error);
    throw new Error('Failed to generate address letter');
  }
}
