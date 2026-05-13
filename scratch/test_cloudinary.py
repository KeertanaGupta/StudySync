import cloudinary
import cloudinary.uploader
import io

cloudinary.config(
    cloud_name="dra6mt46e",
    api_key="384255392562739",
    api_secret="61EnIRuRckA34KndgHgdtPlBw3Y",
    secure=True
)

print("Testing upload with hardcoded credentials and BytesIO...")

try:
    file_content = io.BytesIO(b"this is a test content")
    response = cloudinary.uploader.upload(file_content, resource_type='raw', public_id='test_diagnostic_file')
    print("Upload Success!")
    print(f"Public ID: {response['public_id']}")
    print(f"URL: {response['secure_url']}")
except Exception as e:
    print(f"Upload Failed: {str(e)}")
