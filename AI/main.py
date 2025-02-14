from langchain_community.tools import DuckDuckGoSearchRun
from langchain_openai import ChatOpenAI
from openai import OpenAI
import requests
from PIL import Image
import matplotlib.pyplot as plt
import io
import time
import random
import os
from datetime import datetime
import textwrap
from dotenv import load_dotenv
import subprocess

class ScienceTopicVisualizer:
    # Define topics as class attribute
    topics = [
        # Natural Processes
        "photosynthesis process in plants",
        "cellular respiration steps",
        "nitrogen cycle in nature",
        "carbon cycle process",
        "water cycle in atmosphere",
        
        # Space Technology
        "Starlink satellite constellation system",
        "SpaceX Falcon 9 rocket launch stages",
        "NASA Artemis mission spacecraft",
        "James Webb Space Telescope structure",
        "Mars rover Perseverance components",
        
        # Space Phenomena
        "black hole formation visualization",
        "solar flare eruption process",
        "galaxy formation stages diagram",
        "neutron star structure",
        "planetary formation steps",
        
        # Earth Science
        "tectonic plate movement diagram",
        "volcano internal structure",
        "earthquake wave types diagram",
        "glacier movement mechanics",
        "ocean current patterns map",
        
        # Modern Technology
        "nuclear fusion reactor diagram",
        "quantum computer components",
        "CRISPR gene editing process",
        "renewable energy systems diagram",
        "artificial intelligence neural network",
        
        # Biological Processes
        "DNA replication steps diagram",
        "neural signal transmission pathway",
        "immune system response diagram",
        "hormone regulation process",
        "enzyme catalysis mechanism"
    ]
    
    categories = {
        "Natural Processes": topics[0:5],
        "Space Technology": topics[5:10],
        "Space Phenomena": topics[10:15],
        "Earth Science": topics[15:20],
        "Modern Technology": topics[20:25],
        "Biological Processes": topics[25:30]
    }

    def __init__(self, openai_api_key: str):
        # Create images directory
        self.image_dir = "generated_images"
        os.makedirs(self.image_dir, exist_ok=True)
        
        # Set up OpenAI and LangChain
        os.environ["OPENAI_API_KEY"] = openai_api_key
        self.search = DuckDuckGoSearchRun()
        self.llm = ChatOpenAI(
            api_key=openai_api_key,
            temperature=0.7,
            model_name="gpt-3.5-turbo"
        )
        
        # Initialize DALL-E client
        self.client = OpenAI(api_key=openai_api_key)
        
        # Initialize used topics tracking
        self.used_topics = set()
        
        # Set up the figure
        plt.style.use('dark_background')
        self.setup_figure()

    def setup_figure(self):
        """Set up the matplotlib figure with two subplots"""
        self.fig = plt.figure(figsize=(15, 10))
        self.fig.patch.set_facecolor('#1C1C1C')
        
        # Create grid for subplots
        gs = self.fig.add_gridspec(2, 1, height_ratios=[1, 4])
        
        # Text area for information
        self.ax_text = self.fig.add_subplot(gs[0])
        self.ax_text.axis('off')
        self.ax_text.set_facecolor('#2C2C2C')
        
        # Image area
        self.ax_image = self.fig.add_subplot(gs[1])
        self.ax_image.axis('off')
        self.ax_image.set_facecolor('#2C2C2C')

    def get_random_topic(self):
        """Get a random topic that hasn't been used recently"""
        available_topics = [t for t in self.topics if t not in self.used_topics]
        if not available_topics:
            self.used_topics.clear()
            available_topics = self.topics
        
        topic = random.choice(available_topics)
        category = next((cat for cat, topics in self.categories.items() if topic in topics), "General")
        self.used_topics.add(topic)
        return category, topic

    def save_image(self, image: Image.Image, topic: str, category: str):
        """Save the generated image with topic name and timestamp"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        clean_topic = "".join(x for x in topic if x.isalnum() or x in (' ', '-', '_')).replace(' ', '_')
        filename = f"{clean_topic}_{timestamp}.png"
        filepath = os.path.join(self.image_dir, filename)
        
        try:
            image.save(filepath, 'PNG')
            print(f"\nImage saved: {filepath}")
            return filepath
        except Exception as e:
            print(f"Error saving image: {str(e)}")
            return None

    def get_topic_highlight(self, category: str, topic: str) -> str:
        """Get a single-line highlight about a scientific topic"""
        try:
            if "Space Technology" in category:
                search_query = f"latest {topic} news updates 2024"
            elif "Modern Technology" in category:
                search_query = f"recent {topic} breakthrough development"
            else:
                search_query = f"{topic} scientific explanation process"
            
            search_result = self.search.run(search_query)
            
            if "Process" in category:
                prompt = f"""Based on this information: {search_result}
                Provide a single, clear sentence explaining a key step or interesting fact about {topic}.
                Focus on the mechanism or process."""
            elif "Technology" in category:
                prompt = f"""Based on this information: {search_result}
                Provide a single, recent update or breakthrough about {topic}.
                Include dates or specific achievements if available."""
            else:
                prompt = f"""Based on this information: {search_result}
                Provide a single fascinating fact or recent discovery about {topic}.
                Focus on what makes it interesting."""
            
            response = self.llm.predict(prompt)
            return response.strip()
        
        except Exception as e:
            return f"Error fetching {topic} update: {str(e)}"

    def generate_image(self, topic: str, category: str):
        """Generate an image using DALL-E"""
        try:
            if "Process" in category:
                image_prompt = f"Create a detailed scientific diagram showing the step-by-step {topic}, use clear labels and arrows"
            elif "Technology" in category:
                image_prompt = f"Create a technical diagram or illustration of {topic}, include labels and key components"
            else:
                image_prompt = f"Create a scientific visualization of {topic}, include detailed labels and explanations"

            response = self.client.images.generate(
                model='dall-e-3',
                prompt=image_prompt,
                size='1024x1024',
                quality='hd',
                n=1,
                style='vivid'
            )
            
            image_url = response.data[0].url
            img_response = requests.get(image_url)
            
            if img_response.status_code == 200:
                image = Image.open(io.BytesIO(img_response.content))
                return image, image_prompt, image_url
            else:
                print("Failed to download the image.")
                return None, image_prompt, None
                
        except Exception as e:
            print(f"Error generating image: {str(e)}")
            return None, None

    def update_display(self, category: str, topic: str, highlight: str, image: Image.Image, image_prompt: str):
        """Update the figure with new content"""
        # Clear previous content
        self.ax_text.clear()
        self.ax_image.clear()
        
        # Update text content
        current_time = datetime.now().strftime("%H:%M:%S")
        text_content = f"Time: {current_time}\nCategory: {category}\nTopic: {topic}\n\nDescription: {highlight}\n\nPrompt: {image_prompt}"
        
        # Wrap text for better display
        wrapped_text = textwrap.fill(text_content, width=80)
        self.ax_text.text(0.02, 0.98, wrapped_text, 
                         transform=self.ax_text.transAxes,
                         verticalalignment='top',
                         fontsize=10,
                         color='white',
                         fontfamily='monospace')
        
        # Update image
        self.ax_image.imshow(image)
        self.ax_image.axis('off')
        
        # Refresh the display
        self.fig.canvas.draw()
        plt.pause(0.01)

    def run_updates(self, interval_seconds: int = 60):
        """Run continuous updates"""
        print("\n=== Science & Technology Visualizer ===")
        print("(Press Ctrl+C to stop)")
        
        try:
            while True:
                # Get new topic and generate content
                category, topic = self.get_random_topic()
                highlight = self.get_topic_highlight(category, topic)
                
                # Generate image
                image, image_prompt , image_url = self.generate_image(topic, category)
                
                if image:
                    # Save the image
                    saved_path = self.save_image(image, topic, category)
                    
                    # Update display with new content
                    self.update_display(category, topic, highlight, image, image_prompt)
                    
                    # Display save location
                    if saved_path:
                        print(f"\nImage saved successfully at: {saved_path}")
                        print(f"\nImage_url: {image_url}")
                        print(f"\nCaption: {highlight}")
                        args = ["python3", "generate_hashes.py", "a", "b", "c"]
                        result = subprocess.run(args, capture_output=True, text=True)
                        print(result.stdout)

                        

                # Wait for the specified interval
                time.sleep(interval_seconds)
                
        except KeyboardInterrupt:
            print("\nStopping updates. Goodbye!")
            plt.close('all')

def main():
    # Replace with your OpenAI API key
    load_dotenv()
    openai_api_key = os.getenv("OPENAI_API_KEY")
    
    try:
        visualizer = ScienceTopicVisualizer(openai_api_key)
        visualizer.run_updates()
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    main()