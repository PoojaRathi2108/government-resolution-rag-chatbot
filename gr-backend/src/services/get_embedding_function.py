# from langchain_community.embeddings.ollama import OllamaEmbeddings
# from langchain_community.embeddings.bedrock import BedrockEmbeddings
# from langchain_community.embeddings import SentenceTransformerEmbeddings
from langchain_openai import OpenAIEmbeddings
from dotenv import load_dotenv
load_dotenv()



def get_embedding_function():
    # embeddings = BedrockEmbeddings(
        # credentials_profile_name="default", region_name="us-east-1"    )
    # embeddings = OllamaEmbeddings(model="nomic-embed-text")
    # embeddings=SentenceTransformerEmbeddings(model_name="paraphrase-multilingual-mpnet-base-v2")


    embeddings = OpenAIEmbeddings( model="text-embedding-3-large")
    # With the `text-embedding-3` class
    # of models, you can specify the size
    # of the embeddings you want returned.
    # dimensions=1024

    
    return embeddings



