package University.exam;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Map the /uploads/** URL to the physical upload directory
        String uploadLoc = System.getProperty("os.name").toLowerCase().contains("win") ? "file:C:/uploads/" : "file:/tmp/uploads/";
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(uploadLoc);
    }
}
 