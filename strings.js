const str = {

    /**
     *  Replace params in string.
     *  
     *  @param  {String} str           : String where replace.
     *  @param  {Array}  paramsReplace : Array of objects.
     *                                   [{
     *                                       key  : Name of the param in the template.
     *                                       value: Value for the param to be inserted.
     *                                   }]
     */
    
    insert( str, paramsReplace ){

        let finalStr;
        let objParam;

        for ( let i = 0, len = paramsReplace.length; i < len; i++ ) {
            objParam = paramsReplace[ i ];
            finalStr = str.replace( '{{' + objParam.key + '}}', objParam.value );
        }

        return finalStr;

    },

    // Strings
    subscribe: 'Suscribirme a actualizaciones del tiempo',
    subscriptionHour: '¿A qué hora quieres recibir la alerta? (0-23)',
    subscriptionHourError: 'La hora introducida es incorrecta. (0-23)',
    subscriptionMinute: '¿En qué minuto? (0-59)',
    subscriptionMinuteError: 'Los minutos introducidos son incorrectos. (0-59)',
    subscriptionLocation: 'Necesitamos tu ubicación para enviarte el tiempo.',
    requestLocation: 'Por favor, envíame la ubicación de dónde deseas la previsión metereológica.\n\nPulsa el botón <b>Enviar Localización</b> si deseas desde tu posición actual, o enviame otra ubicación a través del icono del clip de Telegram.',
    sendLocation: 'Enviar localización',
    state: 'Ver mi suscripción',
    unsubscribe: 'Eliminar suscripción',
    current: 'Consultar tiempo actual',
    welcome: '¡Hola {{name}}! Bienvenid@ al bot encargado del servicio del tiempo. ¿Qué te gustaría hacer?',
    showSubscription: 'te enviamos la información del tiempo todos los días',
    at: 'a las',
    weatherPrediction: 'Previsión del tiempo',
    temperature: 'Temperatura',
    subscriptionCompleted: 'Tu suscripción a las alertas del tiempo se ha completado. ¿Qué deseas hacer?',
    subscriptionRemoved: 'Tu suscripción a las alertas del tiempo ha sido eliminada. ¿Qué deseas hacer?',
    rain: 'Lluvia',
    for: 'para',
    snow: 'Nieve'

};

// Export str object
module.exports = str;