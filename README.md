# **Trabajo Práctico \- 82.08 Cloud Computing \- Sistema de Reservas de Restaurantes**

## Integrantes:

- Barbero, Camilo \- 63150  
- Dedeu, Marcos Diego \- 60469  
- Díaz Cantón, Matías \- 62473  
- Pietranera, Ignacio \- 62314

Este repositorio contiene la infraestructura como código (IaC) desarrollada con **Terraform** para el despliegue del sistema de reservas de restaurantes. En esta entrega, se implementa la arquitectura corregida con respecto a la entrega anterior, y con nuevas funcionalidades discutidas con la cátedra.

El proyecto tiene como objetivo desplegar un sistema de gestión de **reservas de restaurantes**, permitiendo crear restaurantes, mesas y reservas, así como obtener y eliminar reservas a través de un API expuesto mediante **API Gateway** y gestionado con **Lambdas**. Los datos son almacenados en **DynamoDB**. Esto nos permite seccionar a los restaurantes en diferentes categorías y ubicaciones, funciones que serán desarrolladas para la última entrega.

## **Dependencias**

Antes de comenzar, asegurarse de tener instaladas las siguientes herramientas:

* **Terraform** (\>= 1.5.x)  
* **AWS CLI**  
* **Sistema operativo: Linux o Mac**  
* **Next.js: Para esto se requiere tener node y npm.**

## **Arquitectura**

Componentes:

* **S3**: Almacenamiento del frontend.  
* **API Gateway**: Exposición de endpoints RESTful para interactuar con las Lambdas.  
* **Lambdas**: Ejecución del backend serverless.  
* **DynamoDB**: Persistencia de los datos del sistema.  
* **Cognito**: Gestión de autenticación de usuarios.  
* **VPC**: Red privada para las Lambdas y bases de datos

## **Configuración y Ejecución**

### **Módulos Externos**

1. **VPC**  
   * **Descripción:** Configura la **Virtual Private Cloud (VPC)** para contener los recursos privados necesarios en AWS. La VPC proporciona una red aislada y segura, donde los recursos como bases de datos y funciones Lambda no son accesibles públicamente.  
   * **Función en la Infraestructura:** Se utiliza para garantizar que los recursos se desplieguen en un entorno seguro y privado dentro de AWS. Las Lambdas, tablas DynamoDB y otros componentes operan dentro de esta VPC.

### **Módulos Custom-made**

1. **api\_gateway\_cors**  
   * **Descripción:** Configura un **API Gateway** para recibir solicitudes HTTP y gestionar las políticas **CORS (Cross-Origin Resource Sharing)**, permitiendo la comunicación segura entre el frontend y backend.  
   * **Función en la Infraestructura:** Permite conectar el frontend al backend utilizando métodos HTTP mediante el API Gateway. El módulo garantiza que las respuestas respeten las políticas CORS necesarias para el funcionamiento seguro del frontend.  
2. **lambda\_module**  
   * **Descripción:** Define las **funciones Lambda**, que contienen la lógica del backend. Cada Lambda realiza operaciones específicas, como crear o eliminar reservas, y está integrada con el API Gateway.  
   * **Función en la Infraestructura:** Estas funciones se invocan a través del API Gateway y ejecutan operaciones esenciales del sistema (crear, eliminar, o consultar reservas).  
3. **dynamodb\_module**  
   * **Descripción:** Configura tablas **DynamoDB**, utilizadas como base de datos NoSQL para almacenar datos de las reservas, restaurantes y mesas.  
   * **Función en la Infraestructura:** Almacena los datos de manera eficiente y escalable, permitiendo la consulta y modificación de reservas sin necesidad de gestionar servidores.

### **Variables y Outputs**

#### **Variables**

Las variables permiten recibir parámetros que se utilizan en todos los módulos del proyecto, facilitando la configuración flexible y centralizada. Al definir variables, es posible adaptar la infraestructura sin necesidad de modificar el código directamente en cada recurso, lo que mejora la escalabilidad y mantiene la coherencia. Cada módulo en el proyecto (como VPC, API Gateway, Lambda y DynamoDB) depende de variables para recibir los valores necesarios para su configuración. Por ejemplo, al definir la región de AWS como una variable, los módulos que crean funciones Lambda o configuran tablas DynamoDB reciben automáticamente ese valor, garantizando que todos los recursos se alojen en la misma ubicación geográfica. 

#### **Outputs**

Los outputs representan las salidas o resultados importantes del proceso de despliegue. Estos valores se utilizan para compartir información relevante con otros módulos o sistemas externos. En este proyecto, los outputs son la URL del API Gateway, el nombre del S3 y la url del frontend.

### **Funciones Utilizadas**

* **join:** Concatena elementos de una lista o cadena usando un delimitador.  
  * Referencia:  
    * infra/api\_gateway\_cors/main.tf línea 4  
* **concat:** Combina varias listas en una única lista.  
  * Referencia:  
    * infra/api\_gateway\_cors/main.tf línea 4  
* **keys:** Extrae las claves de un mapa.  
  * Referencia:  
    * infra/api\_gateway\_cors/main.tf línea 3 y 4  
* **toset:** Convierte una lista en un conjunto para eliminar duplicados.  
  * Referencia:  
    * infra/api\_gateway\_cors/main.tf línea 3  
* **sha1:** Genera un hash SHA-1 de una cadena.  
  * Referencia:  
    * infra/main.tf línea 440  
* **jsonencode:** Convierte un objeto a formato JSON.  
  * Referencia:  
    * infra/main.tf línea 98 y 440  
* **timestamp:** Devuelve el timestamp actual al momento de correr el apply. Lo utilizamos para deployar el frontend cada vez que corremos apply.  
  * Referencia:  
    * infra/main.tf línea 190

### **Meta-Argumentos**

* **depends\_on:** Asegura que un recurso se cree solo después de otro.  
  * Referencias:   
    * infra/main.tf línea 110, 174, 201, 354, 376, 398, 420, 430  
    * infra/api\_gateway\_cors/main.tf línea 25 y 37  
* **for\_each:** Crea múltiples instancias de un recurso usando una lista o mapa.  
  * Referencias:   
    * infra/lambda\_module/main.tf línea 2  
    * infra/dynamodb\_module/main.tf línea 2  
    * infra/api\_gateway\_cors/main.tf línea 9, 17, 30 y 42  
* **lifecycle:** Controla el ciclo de vida del recurso para evitar destrucción accidental.  
  * Referencias:  
    * infra/main.tf línea 448

## **Pasos anteriores a Montar la Infraestructura**

Antes de ejecutar Terraform, asegúrate de tener lo siguiente configurado:

1. **Cuenta de AWS:** Se debe contar con una cuenta de AWS activa y tener permisos para crear recursos como API Gateway, funciones Lambda y DynamoDB.  
2. **Instalación de Terraform:** Descargar e instalar Terraform desde su sitio oficial ([terraform.io](https://www.terraform.io/)). Confirma su instalación ejecutando:  
   `terraform -v.`   
3. **Configuración de AWS CLI:** Se debe configurar las credenciales de AWS utilizando  AWS CLI. Si no lo tenes instalado, descargarlo e instalarlo desde [AWS CLI](https://aws.amazon.com/cli/). Una vez instalado, ejecutar el siguiente comando para ingresar tus credenciales:  
   `aws configure`  
4. **Instalación de Next.js:** Para instalar Next.js, hay que asegurarse de tener Node.js y npm (Node Package Manager) instalados. Puedes verificar si están instalados ejecutando `node --version` y `npm --version` en tu terminal. Si no pudiste, revisa este [link](https://nextjs.org/docs/getting-started/installation).  
5. **Clonar el Proyecto:**  
   Asegúrate de tener el repositorio del proyecto en tu entorno local. Si no lo tenes, clonarlo utilizando Git:  
   `git clone https://github.com/itba-cloud/2024Q2-G4.git`  
   `cd cloud-booktable`

## **Montaje de la Infraestructura con Terraform**

Seguir los pasos a continuación para desplegar la infraestructura utilizando Terraform.

### **1\. Inicializar el Proyecto de Terraform**

Este comando descarga los plugins y módulos necesarios para trabajar con los recursos de AWS.

`terraform init`

**Resultado esperado:**  
Ver un mensaje indicando que la inicialización ha sido exitosa y que los proveedores han sido instalados correctamente.

### **2\. Planificar el Despliegue**

El siguiente paso es revisar qué recursos se van a crear. Terraform generará un plan que detalla todas las acciones que se tomarán en la infraestructura.

`terraform plan`

**Verificación:**  
Revisar la salida del comando para asegurarte de que todo esté configurado como esperas. El plan mostrará todos los recursos a crear, como tablas de DynamoDB, funciones Lambda, y API Gateway.

### **3\. Aplicar los Cambios**

Este comando ejecuta el plan y crea todos los recursos especificados en los archivos .tf.

`terraform apply`

> **Nota:** Terraform pedirá confirmación antes de aplicar los cambios. Escribir "yes" cuando se te solicite. Una vez completado, Terraform mostrará los recursos creados y los **outputs** configurados.

## **Verificar Outputs**

Una vez que la infraestructura ha sido desplegada, es importante verificar las URLs generadas por los **outputs** de Terraform. Estos outputs incluyen:

1. **URL del API Gateway:** Utilizada para enviar solicitudes desde el frontend hacia las funciones Lambda.  
2. **URL del frontend:** La dirección donde está alojada la interfaz del sistema.  
3. **Bucket Name**: Nombre del bucket de S3 donde se almacenan los recursos estáticos o archivos esenciales del sistema.

## **Acceso al Frontend**

Una vez que la infraestructura esté desplegada y configurada, el frontend estará accesible mediante la URL proporcionada en los **outputs** de Terraform. Ingresar esa dirección en tu navegador web para acceder al sistema.

## **Registro e Inicio de Sesión para usuarios**

El sistema de reservas distingue entre dos tipos de usuarios: **clientes** (que realizan reservas) y **owners** o administradores (dueños de restaurantes que gestionan sus restaurantes, mesas y reservas). A continuación, se detallan los pasos específicos para ambos tipos de usuarios en los procesos de **registro (sign up)** e **inicio de sesión (log in)**.

### **Flujo de Registro (Sign Up)**

El proceso de registro en el sistema es unificado tanto para los clientes como para los owners (dueños de restaurantes), garantizando una experiencia de uso coherente y accesible para ambos perfiles. Los usuarios deben proporcionar un correo electrónico, y establecer una contraseña segura. Sin embargo, durante este proceso, el sistema ofrece una opción clave: seleccionar el tipo de cuenta que desean crear. Esta decisión, disponible mediante un campo específico en el formulario, define si la cuenta se registrará como cliente, orientada a realizar reservas en restaurantes, o como owner, con privilegios administrativos para gestionar mesas y reservas en el sistema. 

**Pasos del Sign Up:**

1. Acceso a la página web, en donde se hace el registro.  
2. **Ingreso de datos:**  
   * Correo electrónico  
   * Contraseña \-\> Debe tener mínimo 8 caracteres y contener minúscula, mayúscula, número y símbolo.  
   * Tipo: Client/Admin  
3. **Activación de la cuenta:**  
   * Se enviará un correo de verificación al correo ingresado, en donde tendrá que copiar un código y pegarlo en la página redirigida.  
   * Tras la verificación, el usuario podrá **acceder al sistema**.

### **Flujo de Inicio de Sesión (Log In)**

#### **Inicio de Sesión para Owners**

1. **Acceder a la página de inicio de sesión** mediante la opción "Iniciar Sesión".  
2. **Ingresar correo y contraseña** proporcionados en el registro.  
3. Si las credenciales son correctas, el owner será **redirigido al panel de administración**, donde podrá:  
   * Crear una nueva mesa.  
   * Crear un nuevo restaurante.  
   * Consultar reservas del día.

#### **Inicio de Sesión para Clientes**

1. **Acceder a la página de inicio de sesión** mediante la opción "Iniciar Sesión".  
2. **Ingresar correo electrónico y contraseña** registrados.  
3. Si las credenciales son correctas, el cliente será **redirigido al panel cliente**, donde puede:  
   * Crear reserva.  
   * Borrar reserva.  
   * Consultar reservas vigentes.

## **Operaciones del Owner (administrador)**

El administrador tiene acceso a funciones especiales para gestionar restaurantes, mesas y reservas, siempre con su ID de usuario asociado. En este caso sería el correo electrónico.

### **1\. Crear un Restaurante**

Desde el panel de administrador, seleccionar la opción "Crear Restaurante".

1. Completar el formulario con los datos del restaurante (localidad, categoría y nombre).  
2. Hacer clic en el botón **Create Restaurant** para registrar el nuevo restaurante.

### **2\. Crear una Mesa**

1. Llenar los datos de localidad, categoría y nombre de algún restaurante existente (que ya haya creado mediante la funcionalidad de “Create Restaurant”).  
2. Introducir la capacidad de la mesa.  
3. Seleccionar la opción **Create Mesa**.

### **3\. Ver Reservas del dia**

El administrador puede revisar las reservas del día actual:

1. Llene los datos del restaurante el cual desee chequear las reservas.  
2. Clickee **Get Admin Reservas**.

Los resultados devueltos de cada funcionalidad se verán reflejados en el cuadro de texto “Result”.

## **Operaciones del Cliente**

Los clientes interactúan con el sistema para realizar y gestionar sus reservas de manera sencilla, siempre con su ID de usuario asociado. En este caso sería el correo electrónico.

### **1\. Crear una Reserva**

1. Llenar los datos de locación, categoría, nombre de restaurante, fecha, hora y cantidad de comensales.  
2. Clickear **Create Reserva**.

### **2\. Verificar una Reserva**

1. Presionar **Get My Reservas**.

### **3\. Eliminar una Reserva**

1. Seleccionar fecha y hora de la reserva.  
2. Presionar **Delete Reserva**.

Los resultados devueltos de cada funcionalidad se verán reflejados en el cuadro de texto “Result”.