import React, { useContext, useEffect, useState } from "react";
import { Button, Card, Divider, Form, Input, Select, Upload } from "antd";
import { GlobalContext } from "../../../context/GlobalContext";
import { FileOutlined, InboxOutlined } from "@ant-design/icons";
import FileReaderInput from "react-file-reader";
import { useDropzone } from "react-dropzone";
import { parseString } from "xml2js";
import { Parser } from "graphql/language/parser";
import { area, length, polygon } from "@turf/turf";


const AgregarLotes = () => {
  const URL = process.env.REACT_APP_URL;
  const [form] = Form.useForm();
  const { Option } = Select;
  const [a, setA] = useState(false);
  const [has, setHas] = useState(0);
  const [perimetro, setPerimetro] = useState(0);
  const [datosArchivo, setDatosArchivo] = useState({});

  const {
    idCliente,
    //Ver lotes
    setShowFormAgregar,
    valorGeoJSON,
    setValorGeoJSON,
    campos,
    setCampos,
    clientes,
    setClientes,
    importarArchivo, setImportarArchivo,
    agregarLote, setAgregarLote,
    coordenadasArchivo, setCoordenadasArchivo,
  } = useContext(GlobalContext);

  const [nombreArchivo, setNombreArchivo] = useState(false);
  const [d, setd] = useState(false);
  const [e, setE] = useState([]);

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    accept: ".kml",
    multiple: false,
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const kmlData = e.target.result;
        console.log('kmlData: ', kmlData);

        parseString(kmlData, (err, result) => {
          if (err) {
            console.error(err);
            return;
          }
          const nameFile = result.kml.Document[0].name
          console.log('nameFile: ', nameFile);
          setNombreArchivo(nameFile)
          const coordinates = result.kml.Document[0].Placemark[0].Polygon[0].outerBoundaryIs[0].LinearRing[0].coordinates[0];
          setDatosArchivo(result.kml.Document[0])
          console.log('datosArchivo: ', datosArchivo);
          const coordinatesArray = coordinates.split(' ').map(coord => {
            const [longitude, latitude] = coord.trim().split(',').map(parseFloat);
            return [longitude, latitude];
          });

          // Filtrar los elementos no deseados (NaN o undefined)
          const filteredCoordinatesArray = coordinatesArray.filter(coord => {
            const [longitude, latitude] = coord;
            return !isNaN(longitude) && !isNaN(latitude) && longitude !== undefined && latitude !== undefined;
          });
          // setCoordenadasArchivo(filteredCoordinatesArray);
          setE(filteredCoordinatesArray)
          setd(true)

          console.log('coordinatesArray: ', coordinatesArray);
          console.log('filteredCoordinatesArray: ', filteredCoordinatesArray);
          console.log('coordenadasArchivo: ', coordenadasArchivo);
          // Aquí puedes hacer lo que quieras con las coordenadas
        });
      };
      reader.readAsText(file);
      console.log('datosArchivo1: ', datosArchivo);
    },
  });

  console.log('datosArchivo2: ', datosArchivo);
  const coordenadas = [
    [-62.90483574185703, -32.00349828755903],
    [-62.91024179555724, -32.00344057063708],
    [-62.91025501328677, -32.00826938515221],
    [-62.9085600818393, -32.00844598413487],
    [-62.9076738084166, -32.00919553280347],
    [-62.90468033324945, -32.00703824315367],
    [-62.90483574185703, -32.00349828755903]
  ];


  // var hectareas = 0;
  function calcularHectareas(coordenadas) {
    const poligono = polygon([coordenadas]);
    const area1 = area(poligono);
    const hectareas = area1 / 10000;
    const hectareasRedoneada = hectareas.toFixed(2);
    return hectareasRedoneada;
  }

  function calcularPerimetro(coordenadas) {
    const poligono = polygon([coordenadas]);
    const perimetroEnMetros = length(poligono, { units: "meters" });
    const perimetroRedondeado = perimetroEnMetros.toFixed(2);
    return perimetroRedondeado;
  }


  useEffect(() => {
    setd(false)
    console.log('eeeeeeeeeeeee: ', e);
    setCoordenadasArchivo(e);
    if (e.length > 0) {
      console.log('ENTRO IF');
      // hectareas = calcularHectareas(e);
      setHas(calcularHectareas(e));
      setPerimetro(calcularPerimetro(e));
      console.log('SALIO IF');
    }
    console.log('coordenadasArchivo: ', coordenadasArchivo);
    console.log('hectáreas: ', has);
  }, [d])
  console.log('hectáreas: ', has);
  console.log('coordenadasArchivo: ', coordenadasArchivo);

  useEffect(() => {
    traeCampos();
    traeClientes();
  }, [])


  function traeCampos() {
    const data = new FormData();
    fetch(`${URL}lot_listCampos.php`, {
      method: "POST",
      body: data,
    }).then(function (response) {
      response.text().then((resp) => {
        const data = resp;
        const objetoData = JSON.parse(data);
        setCampos(objetoData);
      });
    });
  }

  function traeClientes() {
    const data = new FormData();
    fetch(`${URL}lot_listClientes.php`, {
      method: "POST",
      body: data,
    }).then(function (response) {
      response.text().then((resp) => {
        const data = resp;
        const objetoData = JSON.parse(data);
        setClientes(objetoData);
      });
    });
  }


  const onSubmitAdd = (values) => {
    if (valorGeoJSON.length === 0) {
      setA(true);
    } else {
      const dataAdd = new FormData();
      dataAdd.append("idC", idCliente);
      dataAdd.append("lote", values.nombre);
      dataAdd.append("has", values.has);
      dataAdd.append("campo", values.campo);
      dataAdd.append("cliente", values.cliente);
      dataAdd.append("participacion", values.participacion);
      dataAdd.append("condicion", values.condicion);
      dataAdd.append("valorGeoJSON", JSON.stringify(valorGeoJSON));

      console.log("valorGeoJSON: ", valorGeoJSON);
      console.log("onSubmitAdd: ", dataAdd);

      fetch(`${URL}client_addLote.php`, {
        method: "POST",
        body: dataAdd,
      }).then(function (response) {
        response.text().then((resp) => {
          const data = resp;
          console.log("data: ", data);
        });
      });

      setShowFormAgregar(false);
      form.resetFields();
      setValorGeoJSON([]);
    }
  };

  const onSubmitImportarArchivo = (values) => {
    if (coordenadasArchivo.length === 0) {
      setA(true);
    } else {
      const dataAdd = new FormData();
      dataAdd.append("idC", idCliente);
      dataAdd.append("lote", datosArchivo.Placemark[0].name);
      dataAdd.append("has", has);
      dataAdd.append("campo", values.campo);
      dataAdd.append("cliente", values.cliente);
      dataAdd.append("participacion", values.participacion);
      dataAdd.append("condicion", values.condicion);
      dataAdd.append("valorGeoJSON", JSON.stringify(coordenadasArchivo));
      dataAdd.append("lat", datosArchivo.Placemark[0].LookAt[0].latitude);
      dataAdd.append("lon", datosArchivo.Placemark[0].LookAt[0].longitude);

      // console.log("valorGeoJSON: ", coordenadasArchivo);
      // console.log("onSubmitImportarArchivo: ", dataAdd);

      fetch(`${URL}client_addLote.php`, {
        method: "POST",
        body: dataAdd,
      }).then(function (response) {
        response.text().then((resp) => {
          const data = resp;
          console.log("data: ", data);
        });
      });

      setShowFormAgregar(false);
      form.resetFields();
      setValorGeoJSON([]);
      setImportarArchivo(false);
    }
  };


  return (
    <>
      {agregarLote &&
        (
          <Card
            style={{
              width: "800px",
              height: "40%",
              marginTop: "16%",
              marginLeft: "10px",
              marginRight: "10px",
            }}
          >
            <Form form={form} onFinish={onSubmitAdd}>
              <div>
                <h1 className="titulos">NUEVO LOTE</h1>
                <Divider style={{ marginBottom: "10px", marginTop: "0px" }} />
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    paddingBottom: "15px",
                  }}
                >


                  <div style={{ display: 'flex', flexDirection: 'row', marginBottom: '10px' }} >

                    <Form.Item
                      name="nombre"
                      label="Nombre Lote"
                      rules={[
                        {
                          required: true,
                          message: "Por favor ingresa el nombre del lote",
                        },
                      ]}
                      className="hidden-asterisk" // Agregar esta línea para ocultar el asterisco
                    >
                      <Input
                        style={{
                          width: "200px",
                          marginRight: "15px",
                        }}
                      />
                    </Form.Item>

                    <Form.Item
                      name="has"
                      label="Hectáreas"
                      rules={[
                        {
                          required: true,
                          message: "Por favor ingrese las hectáreas del lote",
                        },
                      ]}
                      className="hidden-asterisk" // Agregar esta línea para ocultar el asterisco
                    >
                      <Input
                        type="number"
                        style={{
                          width: "82px",
                          // marginRight: "20px",
                          marginLeft: '15px'
                        }}
                      />
                    </Form.Item>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'row' }} >
                    <Form.Item
                      name="campo"
                      label="Campo"
                      rules={[
                        {
                          required: true,
                          message: "Por favor selecciona un cliente",
                        },
                      ]}
                      className="hidden-asterisk" // Agregar esta línea para ocultar el asterisco
                    >
                      <Select
                        style={{ width: "200px", marginLeft: '36px' }}
                        showSearch
                        optionFilterProp="children"
                        filterOption={(input, option) =>
                          option.children &&
                          option.children
                            .toLowerCase()
                            .indexOf(input.toLowerCase()) >= 0
                        }
                      >
                        {campos &&
                          campos.map((campo) => (
                            <Select.Option key={campo.cam_id} value={campo.cam_id}>
                              {campo.cam_nombre}
                            </Select.Option>
                          ))}
                      </Select>
                    </Form.Item>
                  </div>


                </div>

                <h1 className="titulos">PARTICIPACIÓN</h1>
                <Divider style={{ marginBottom: "10px", marginTop: "0px" }} />
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    paddingBottom: "5px",
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'row', marginBottom: '10px' }} >

                    <Form.Item
                      name="cliente"
                      label="Cliente"
                      rules={[
                        {
                          required: true,
                          message: "Por favor selecciona un cliente",
                        },
                      ]}
                      className="hidden-asterisk" // Agregar esta línea para ocultar el asterisco
                      style={{ marginRight: '8px' }}
                    >
                      <Select
                        style={{ width: "200px", marginLeft: '36px', marginRight: '10px' }}
                        showSearch
                        optionFilterProp="children"
                        filterOption={(input, option) =>
                          option.children &&
                          option.children
                            .toLowerCase()
                            .indexOf(input.toLowerCase()) >= 0
                        }
                      >
                        {clientes &&
                          clientes.map((cliente) => (
                            <Select.Option
                              key={cliente.cli_id}
                              value={cliente.cli_id}
                            >
                              {cliente.cli_nombre}
                            </Select.Option>
                          ))}
                      </Select>
                    </Form.Item>
                    <Form.Item
                      name="participacion"
                      label="Participación"
                      rules={[
                        {
                          required: true,
                          message: "Por favor ingrese la participación",
                        },
                      ]}
                      className="hidden-asterisk" // Agregar esta línea para ocultar el asterisco
                      style={{ marginRight: "10px" }}
                    >
                      <Input style={{ width: "82px" }} addonAfter="%" />
                    </Form.Item>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'row' }} >
                    <Form.Item
                      name="condicion"
                      label="Condición"
                      rules={[
                        {
                          required: true,
                          message: "Por favor selecciona una condición",
                        },
                      ]}
                      className="hidden-asterisk" // Agregar esta línea para ocultar el asterisco
                    >
                      <Select
                        style={{
                          width: "200px",
                          // marginRight: "15px",
                          marginLeft: '17px',
                        }}
                      >
                        <Option value="1">PROPIO</Option>
                        <Option value="2">ALQUILADO</Option>
                      </Select>
                    </Form.Item>
                  </div>

                </div>

                <Divider style={{ marginBottom: "10px", marginTop: "0px" }} />
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    {a ? (
                      <label style={{ color: "red" }}>
                        * Por favor marque el lote
                      </label>
                    ) : (
                      ""
                    )}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      justifyContent: "flex-end",
                    }}
                  >
                    <Button type="primary" htmlType="submit">
                      Guardar
                    </Button>
                    <Button
                      onClick={() => (
                        setShowFormAgregar(false), form.resetFields()
                      )}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </div>
            </Form>
          </Card >
        )
      }
      {importarArchivo && (
        <Card
          style={{
            width: "900px",
            height: "40%",
            marginTop: "16%",
            marginLeft: "10px",
            marginRight: "10px",
          }}
        >
          <Form form={form} onFinish={onSubmitImportarArchivo}>
            <div>
              <h1 className="titulos">IMPORTAR ARCHIVO</h1>
              <Divider style={{ marginBottom: "10px", marginTop: "0px" }} />
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  paddingBottom: "15px",
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'row' }}>

                  <div style={{ display: 'flex', flexDirection: 'column', marginRight: '15px' }}>
                    <Form.Item
                      name="kmlFile"
                      label="Archivo KML"
                      rules={[
                        {
                          required: false,
                          message: "Por favor seleccione un archivo KML",
                        },
                      ]}
                      className="hidden-asterisk" // Agregar esta línea para ocultar el asterisco
                      style={{ marginLeft: '15px' }}
                    >
                      <div {...getRootProps()} className="dropzone">
                        <input {...getInputProps()} />
                        {isDragActive ? (
                          <p>Suelta el archivo aquí...</p>
                        ) : (
                          <Button icon={<InboxOutlined />}>
                            Seleccionar archivo
                          </Button>
                        )}
                      </div>
                    </Form.Item>
                    {nombreArchivo && (
                      <div style={{ display: 'flex', flexDirection: 'row', marginLeft: '110px' }}>
                        <FileOutlined style={{ marginRight: '5px', color: 'green' }} />
                        <p style={{ color: 'green' }}>Nombre Archivo: {nombreArchivo}</p>
                      </div>
                    )}
                  </div>
                  <div>
                    <Form.Item
                      name="campo"
                      label="Campo"
                      rules={[
                        {
                          required: true,
                          message: "Por favor selecciona un cliente",
                        },
                      ]}
                      className="hidden-asterisk" // Agregar esta línea para ocultar el asterisco
                    >
                      <Select
                        style={{ width: "200px", marginLeft: '36px' }}
                        showSearch
                        optionFilterProp="children"
                        filterOption={(input, option) =>
                          option.children &&
                          option.children
                            .toLowerCase()
                            .indexOf(input.toLowerCase()) >= 0
                        }
                      >
                        {campos &&
                          campos.map((campo) => (
                            <Select.Option key={campo.cam_id} value={campo.cam_id}>
                              {campo.cam_nombre}
                            </Select.Option>
                          ))}
                      </Select>
                    </Form.Item>
                    <Form.Item
                      name="cliente"
                      label="Cliente"
                      rules={[
                        {
                          required: true,
                          message: "Por favor selecciona un cliente",
                        },
                      ]}
                      className="hidden-asterisk" // Agregar esta línea para ocultar el asterisco
                      style={{ marginRight: '8px' }}
                    >
                      <Select
                        style={{ width: "200px", marginLeft: '36px', marginRight: '10px' }}
                        showSearch
                        optionFilterProp="children"
                        filterOption={(input, option) =>
                          option.children &&
                          option.children
                            .toLowerCase()
                            .indexOf(input.toLowerCase()) >= 0
                        }
                      >
                        {clientes &&
                          clientes.map((cliente) => (
                            <Select.Option
                              key={cliente.cli_id}
                              value={cliente.cli_id}
                            >
                              {cliente.cli_nombre}
                            </Select.Option>
                          ))}
                      </Select>
                    </Form.Item>
                    <Form.Item
                      name="participacion"
                      label="Participación"
                      rules={[
                        {
                          required: true,
                          message: "Por favor ingrese la participación",
                        },
                      ]}
                      className="hidden-asterisk" // Agregar esta línea para ocultar el asterisco
                      style={{ marginRight: "10px" }}
                    >
                      <Input style={{ width: "82px" }} addonAfter="%" />
                    </Form.Item>
                    <Form.Item
                      name="condicion"
                      label="Condición"
                      rules={[
                        {
                          required: true,
                          message: "Por favor selecciona una condición",
                        },
                      ]}
                      className="hidden-asterisk" // Agregar esta línea para ocultar el asterisco
                    >
                      <Select
                        style={{
                          width: "200px",
                          // marginRight: "15px",
                          marginLeft: '17px',
                        }}
                      >
                        <Option value="1">PROPIO</Option>
                        <Option value="2">ALQUILADO</Option>
                      </Select>
                    </Form.Item>

                  </div>
                  {datosArchivo && datosArchivo.Placemark && datosArchivo.Placemark[0] &&
                    <div style={{ display: 'flex', flexDirection: 'column', marginRight: '15px' }}>
                      <label>Nombre Lote: {datosArchivo && datosArchivo.Placemark[0].name} </label>
                      <label>Latitud: {datosArchivo && datosArchivo.Placemark[0].LookAt[0].latitude} </label>
                      <label>Longitud: {datosArchivo && datosArchivo.Placemark[0].LookAt[0].longitude} </label>
                      <label>Hectáreas: {has > 0 && has} Has. </label>
                      <label>Perímetro:  {perimetro > 0 && perimetro} Mts. </label>
                    </div>
                  }
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "flex-end",
                }}
              >
                <Button
                  type="primary"
                  htmlType="submit"
                >
                  Guardar
                </Button>
                <Button
                // onClick={() => (
                //   setShowFormAgregar(false), form.resetFields()
                // )}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </Form>
        </Card>
      )}
    </>
  );
};

export default AgregarLotes;
