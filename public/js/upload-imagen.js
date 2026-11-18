/**
 * HABITABOGOTÁ — /public/js/upload-imagen.js
 * Gestión de subida de imágenes a Cloudinary usando firma generada en el servidor.
 */

let uploadedImagesList = [];

async function initCloudinaryUpload() {
  const fileInput = document.getElementById('cloudinary-file-input');
  const previewsGrid = document.getElementById('cloudinary-previews-grid');
  const publishForm = document.getElementById('form-publicar-vivienda');

  if (!fileInput || !previewsGrid) return;

  fileInput.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    for (const file of files) {
      if (uploadedImagesList.length >= 10) {
        showToast('Máximo 10 imágenes permitidas.', 'icon-alert');
        break;
      }

      showToast(`Subiendo ${file.name} a Cloudinary...`);

      try {
        // 1. Obtener firma del backend
        const sigRes = await apiFetch('/api/cloudinary/firma?folder=habitabogota/viviendas');
        if (!sigRes.ok) throw new Error('No se pudo obtener firma de Cloudinary.');

        const { signature, timestamp, apiKey, cloudName, folder } = sigRes;

        // 2. Subir directamente a Cloudinary API
        const formData = new FormData();
        formData.append('file', file);
        formData.append('api_key', apiKey);
        formData.append('timestamp', timestamp);
        formData.append('signature', signature);
        formData.append('folder', folder);

        const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: 'POST',
          body: formData
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          throw new Error(uploadData.error?.message || 'Error en subida a Cloudinary.');
        }

        const imageData = {
          cloudinary_public_id: uploadData.public_id,
          url: uploadData.secure_url,
          url_thumb: uploadData.secure_url,
          orden: uploadedImagesList.length
        };

        uploadedImagesList.push(imageData);
        renderCloudinaryPreviews();
        showToast('¡Imagen subida con éxito!');
      } catch (err) {
        showToast(err.message || 'Error al subir imagen.', 'icon-alert');
      }
    }

    fileInput.value = '';
  });

  if (publishForm) {
    publishForm.onsubmit = async (e) => {
      e.preventDefault();

      if (uploadedImagesList.length === 0) {
        showToast('Debes subir al menos una imagen del inmueble.', 'icon-alert');
        return;
      }

      const titulo = document.getElementById('pub-titulo').value.trim();
      const descripcion = document.getElementById('pub-descripcion').value.trim();
      const operacion = document.getElementById('pub-operacion').value;
      const tipo = document.getElementById('pub-tipo').value;
      const barrio = document.getElementById('pub-barrio').value.trim();
      const localidad = document.getElementById('pub-localidad').value.trim();
      const direccion_aprox = document.getElementById('pub-direccion').value.trim();
      const precio = Number(document.getElementById('pub-precio').value);
      const administracion = Number(document.getElementById('pub-admin').value) || 0;
      const deposito = document.getElementById('pub-deposito').value ? Number(document.getElementById('pub-deposito').value) : null;
      const habitaciones = Number(document.getElementById('pub-habitaciones').value) || 1;
      const banos = Number(document.getElementById('pub-banos').value) || 1;
      const area_m2 = Number(document.getElementById('pub-area').value);

      const mascotas = document.getElementById('pub-mascotas').checked;
      const parqueadero = document.getElementById('pub-parqueadero').checked;
      const balcon = document.getElementById('pub-balcon').checked;
      const gimnasio = document.getElementById('pub-gimnasio').checked;
      const piscina = document.getElementById('pub-piscina').checked;
      const porteria = document.getElementById('pub-porteria').checked;

      const lat = Number(document.getElementById('pub-lat').value) || 4.6500;
      const lng = Number(document.getElementById('pub-lng').value) || -74.0500;

      const payload = {
        titulo,
        descripcion,
        tipo,
        operacion,
        barrio,
        localidad,
        direccion_aprox,
        precio,
        administracion,
        deposito,
        habitaciones,
        banos,
        area_m2,
        mascotas,
        parqueadero,
        balcon,
        gimnasio,
        piscina,
        porteria,
        requisitos: ['Estudio de aseguradora tradicional', 'Codeudor con finca raíz'],
        lat,
        lng,
        imagenes: uploadedImagesList,
        puntos_interes: []
      };

      try {
        const res = await apiFetch('/api/viviendas', {
          method: 'POST',
          body: JSON.stringify(payload)
        });

        showToast('¡Inmueble publicado con éxito!');
        setTimeout(() => {
          window.location.href = `/inmueble.html?id=${res.vivienda.id}`;
        }, 1200);
      } catch (err) {
        showToast(err.message || 'Error al publicar inmueble.', 'icon-alert');
      }
    };
  }
}

function renderCloudinaryPreviews() {
  const grid = document.getElementById('cloudinary-previews-grid');
  if (!grid) return;

  grid.innerHTML = uploadedImagesList
    .map(
      (img, idx) => `
    <div style="position: relative; border: 1.5px solid var(--color-ink); border-radius: var(--radius-sm); overflow: hidden; background: #fff; height: 90px;">
      <img src="${img.url}" alt="Foto ${idx + 1}" style="width: 100%; height: 100%; object-fit: cover;">
      <button type="button" onclick="removeCloudinaryImage(${idx})" style="position: absolute; top: 2px; right: 2px; background: var(--color-terracotta); color: #fff; border: none; border-radius: 50%; width: 22px; height: 22px; cursor: pointer; font-weight: 700; font-size: 0.75rem;" title="Eliminar foto">×</button>
    </div>
  `
    )
    .join('');
}

window.removeCloudinaryImage = function (index) {
  uploadedImagesList.splice(index, 1);
  renderCloudinaryPreviews();
};

document.addEventListener('DOMContentLoaded', () => {
  initCloudinaryUpload();
});
