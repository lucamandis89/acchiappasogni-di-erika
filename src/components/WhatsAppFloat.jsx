function WhatsAppFloat() {
  const phone = '393440260906'

  const message =
    'Ciao Erika! Ti contatto dal sito Gli Acchiappasogni di Ery. Vorrei avere alcune informazioni.'

  const whatsappUrl =
    `https://wa.me/${phone}?text=${encodeURIComponent(message)}`

  return (
    <>
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="whatsapp-float"
        aria-label="Contattaci su WhatsApp"
        title="Scrivici su WhatsApp"
      >
        <svg
          viewBox="0 0 32 32"
          aria-hidden="true"
        >
          <path
            fill="currentColor"
            d="M16.04 3C9.4 3 4 8.35 4 14.94c0 2.3.67 4.55 1.93 6.47L4 28.5l7.3-1.9a12.1 12.1 0 0 0 4.73.96h.01C22.68 27.56 28 22.2 28 15.6 28 8.98 22.68 3 16.04 3Zm0 22.55a10.05 10.05 0 0 1-4.32-.98l-.31-.15-4.33 1.13 1.16-4.18-.2-.33a9.9 9.9 0 0 1-1.52-5.27c0-5.46 4.45-9.9 9.92-9.9 5.46 0 9.9 4.44 9.9 9.9 0 5.46-4.44 9.78-9.9 9.78h-.4Zm5.44-7.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.08-.79.37-.27.3-1.04 1.02-1.04 2.49 0 1.47 1.07 2.89 1.22 3.09.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.42.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35Z"
          />
        </svg>

        <span className="whatsapp-tooltip">
          Scrivici su WhatsApp
        </span>
      </a>

      <style>{`
        .whatsapp-float {
          position: fixed;
          right: 22px;
          bottom: 22px;
          z-index: 9999;
          width: 58px;
          height: 58px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #25d366;
          color: #ffffff;
          text-decoration: none;
          box-shadow:
            0 8px 25px rgba(0, 0, 0, 0.2);
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
        }

        .whatsapp-float svg {
          width: 34px;
          height: 34px;
        }

        .whatsapp-float:hover {
          transform: translateY(-3px) scale(1.04);
          box-shadow:
            0 12px 30px rgba(0, 0, 0, 0.25);
        }

        .whatsapp-tooltip {
          position: absolute;
          right: 70px;
          white-space: nowrap;
          padding: 9px 13px;
          border-radius: 8px;
          background: #493b35;
          color: #ffffff;
          font-family: Arial, sans-serif;
          font-size: 12px;
          font-weight: 600;
          opacity: 0;
          visibility: hidden;
          transform: translateX(5px);
          transition: 0.2s ease;
          pointer-events: none;
          box-shadow:
            0 5px 18px rgba(0, 0, 0, 0.15);
        }

        .whatsapp-float:hover
        .whatsapp-tooltip {
          opacity: 1;
          visibility: visible;
          transform: translateX(0);
        }

        @media (max-width: 600px) {
          .whatsapp-float {
            width: 54px;
            height: 54px;
            right: 16px;
            bottom: 16px;
          }

          .whatsapp-float svg {
            width: 32px;
            height: 32px;
          }

          .whatsapp-tooltip {
            display: none;
          }
        }
      `}</style>
    </>
  )
}

export default WhatsAppFloat