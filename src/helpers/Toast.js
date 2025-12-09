import Swal from 'sweetalert2';

export const errorToast = (message) => {
  Swal.fire({
    toast: true,
    position: 'top-end',
    icon: 'error',
    title: message,
    showConfirmButton: false,
    timer: 3000,
  });
};
export const successToast = (message) => {
  Swal.fire({
    toast: true,
    position: 'top-end',
    icon: 'success',
    title: message,
    showConfirmButton: false,
    timer: 3000,
  });
};

export const warningToast = (message) => {
  Swal.fire({
    toast: true,
    position: 'top-end',
    icon: 'warning',
    title: message,
    showConfirmButton: false,
    timer: 3000,
  });
};

export const errorModal = (title, message) => {
  Swal.fire({
    icon: 'error',
    title: title,
    html: message,
    confirmButtonColor: '#d33',
    confirmButtonText: 'Close',
  });
};
