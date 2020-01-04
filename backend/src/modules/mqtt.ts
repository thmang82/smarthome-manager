import * as mqtt from 'mqtt';
import { ConfigFile } from "../types/config";

const IDENT_INTERTECHNO = "intertechno_event";

export class MqttClass {
    private client: mqtt.Client | undefined;
    private topic: string;

    constructor(){

    }

    public loadNewConfig(config: ConfigFile){
        if (this.client){
            if (this.getIsConnected()){
                this.client.end();  
            }
            this.client = undefined;
        }

        if (config.mqtt && config.mqtt.url && config.mqtt.topic){
            this.topic = config.mqtt.topic;
            this.client = mqtt.connect('mqtt://localhost');
            this.client.on('connect', () => {
                console.log('MQTT: connect');
                if (this.client){
                    this.client.subscribe('miflora/#');
                    this.client.subscribe(IDENT_INTERTECHNO);
                }
            })

            this.client.on('reconnect', () => {
                console.log('MQTT: reconnect');
            })
            
            this.client.on('message', (topic, message) => {
                let message_str = message.toString();
                console.log("MQTT message - topic:" + topic + " message_str:", message_str);
                let topic_elems = topic.split("/");
                console.log("MQTT topic_elems",topic_elems);
            })
        } else {
            console.error("No MQTT URL/Topic found in config");
        }
    }

    public publish = (topic: string, message: string, retain: boolean) => {
        if (this.client && this.getIsConnected()){
            const topic_use = this.topic + "/" + topic;
            this.client.publish(topic_use, message, {retain: retain, qos: 0, dup: false});
        }
    }
    
    public getIsConnected = (): boolean => {
        return this.client && this.client.connected ? true : false;
    }
    
}

export const mqttService: MqttClass = new MqttClass();