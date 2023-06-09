import React, { useContext } from 'react'
import { GlobalContext } from '../../context/GlobalContext';

export const NegociosCliente = () => {
  const PORT = window.location.port ? window.location.port : 80;
  const PROTOCOL = window.location.protocol;
  const HOSTNAME = window.location.hostname;
  const URL = `${PROTOCOL}//${HOSTNAME}:${PORT}`;

  const {
    idCliente,
  } = useContext(GlobalContext);

  return (
    <>
      <iframe
            loading="lazy"
            src={`${URL}/duoc/modulos/negocios_clientes/?idC=${idCliente}`}
            width={"100%"}
            height={"500"}
            style={{ border: "none" }}
            title="Negocios Cliente"
          ></iframe>
    </>
  )
}

export default NegociosCliente;