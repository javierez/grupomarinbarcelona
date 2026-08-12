

export type ContactProps = {
  title: string;
  subtitle: string;
  messageForm: boolean;
  address: boolean;
  phone: boolean;
  mail: boolean;
  schedule: boolean;
  map: boolean;
  // Optional hero banner for /contacto page. Absent => no hero rendered.
  heroImage?: string;
  heroVideo?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  // Optional dedicated WhatsApp number for the floating button. When set (and a
  // valid Spanish mobile), it overrides the default-office phone. Lets the
  // WhatsApp line differ from any single office's displayed number.
  whatsappNumber?: string;
  // Contact information fields
  offices: Array<{
    id: string;
    name: string;
    address: {
      street: string;
      city: string;
      state: string;
      country: string;
      postalCode?: string;
    };
    phoneNumbers: {
      main: string;
      sales?: string;
    };
    emailAddresses: {
      info: string;
      sales?: string;
    };
    scheduleInfo: {
      weekdays: string;
      saturday: string;
      sunday: string;
    };
    mapUrl: string;
    isDefault?: boolean;
  }>;
};

export const getContactProps = (_accountIdArg?: bigint): ContactProps | null => {
  return {
  "title": "Contáctanos",
  "subtitle": "Estamos aquí para ayudarte",
  "messageForm": true,
  "address": true,
  "phone": true,
  "mail": true,
  "schedule": true,
  "map": true,
  "whatsappNumber": "663946837",
  "offices": [{
  "id": "office-1",
  "name": "Grupo Marín Premià",
  "mapUrl": "https://www.google.com/maps/search/?api=1&query=Carrer%20Geranis%2C%2025%2C%20Premi%C3%A0%20de%20Dalt%2C%20Barcelona%2C%2008338",
  "address": {
  "city": "Premià de Dalt",
  "state": "Barcelona",
  "street": "Carrer Geranis, 25",
  "country": "España"
},
  "isDefault": false,
  "phoneNumbers": {
  "main": "695611457"
},
  "scheduleInfo": {
  "sunday": "Domingo: Cerrado",
  "saturday": "Sábado: 10:00 - 14:00",
  "weekdays": "Lunes a Viernes: 9:00 - 19:00"
},
  "emailAddresses": {
  "info": "info@grupomarinccm.com"
}
}, {
  "id": "office-2",
  "name": "Grupo Marín Vilassar de Mar",
  "mapUrl": "https://www.google.com/maps/search/?api=1&query=Av.%20Montevideo%2C%20150%2C%20Vilassar%20de%20Mar%2C%20Barcelona",
  "address": {
  "city": "Vilassar de Mar",
  "state": "Barcelona",
  "street": "Av. Montevideo, 150",
  "country": "España"
},
  "isDefault": false,
  "phoneNumbers": {
  "main": "936178921"
},
  "scheduleInfo": {
  "sunday": "Domingo: Cerrado",
  "saturday": "Sábado: 10:00 - 14:00",
  "weekdays": "Lunes a Viernes: 9:00 - 19:00"
},
  "emailAddresses": {
  "info": "grupomarinvdm@gmail.com"
}
}, {
  "id": "office-3",
  "name": "Grupo Marín Barcelona",
  "mapUrl": "https://www.google.com/maps/search/?api=1&query=Carrer%20Sardenya%2C%20206%2C%20Barcelona%2C%20Barcelona",
  "address": {
  "city": "Barcelona",
  "state": "Barcelona",
  "street": "Carrer Sardenya, 206",
  "country": "España"
},
  "isDefault": true,
  "phoneNumbers": {
  "main": "936178921"
},
  "scheduleInfo": {
  "sunday": "Domingo: Cerrado",
  "saturday": "Sábado: 10:00 - 14:00",
  "weekdays": "Lunes a Viernes: 9:00 - 19:00"
},
  "emailAddresses": {
  "info": "grupomarinbcn@gmail.com"
}
}, {
  "id": "office-4",
  "name": "Grupo Marín Blanes",
  "mapUrl": "https://www.google.com/maps/search/?api=1&query=Carrer%20Crist%C3%B2fol%20Colom%2C%2028%2C%20Blanes%2C%20Girona%2C%2017300",
  "address": {
  "city": "Blanes",
  "state": "Girona",
  "street": "Carrer Cristòfol Colom, 28",
  "country": "España"
},
  "isDefault": false,
  "phoneNumbers": {
  "main": "663946837"
},
  "scheduleInfo": {
  "sunday": "Domingo: Cerrado",
  "saturday": "Sábado: 10:00 - 14:00",
  "weekdays": "Lunes a Viernes: 9:00 - 19:00"
},
  "emailAddresses": {
  "info": "grupomarinbcn@gmail.com"
}
}]
};
}

