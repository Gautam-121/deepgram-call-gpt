function saveBufferToFile(buffer) {
    const tempFilePath = path.join(
      'C:\\Users\\1\\AppData\\Local\\Temp',
      '68b36e7d-7755-4651-bff6-0b653d44eca7.ogg'
    );
    fs.writeFileSync(tempFilePath, buffer);
    console.log('Temporary file created at:', tempFilePath);
    return tempFilePath;
  }

  sa