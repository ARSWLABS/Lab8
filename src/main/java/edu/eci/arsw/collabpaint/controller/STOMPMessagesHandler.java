package edu.eci.arsw.collabpaint.controller;

import edu.eci.arsw.collabpaint.model.Point;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Controller
public class STOMPMessagesHandler {

    @Autowired
    private SimpMessagingTemplate msgt;

    private ConcurrentHashMap<String, List<Point>> drawingPoints = new ConcurrentHashMap<>();

    @MessageMapping("/newpoint.{numdibujo}")
    public void handlePointEvent(Point pt, @DestinationVariable String numdibujo) throws Exception {
        System.out.println("Nuevo punto recibido en el servidor!: " + pt);

        drawingPoints.putIfAbsent(numdibujo, new CopyOnWriteArrayList<>());
        List<Point> points = drawingPoints.get(numdibujo);
        points.add(pt);

        // Enviar punto a los suscriptores de '/topic/newpoint'
        msgt.convertAndSend("/topic/newpoint." + numdibujo, pt);

        // Si hay 4 puntos, enviar el polígono
        if (points.size() >= 4) {
            msgt.convertAndSend("/topic/newpolygon." + numdibujo, points);
            points.clear(); // Reset para el próximo polígono
        }
    }
}
